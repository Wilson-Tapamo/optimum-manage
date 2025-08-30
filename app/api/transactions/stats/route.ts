import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request)
        checkPermission(user.role, ['DIRECTEUR'])

        const url = new URL(request.url)
        const period = url.searchParams.get('period') || '12m' // 1m, 3m, 6m, 12m, all
        const groupBy = url.searchParams.get('groupBy') || 'month' // day, week, month, year

        // Calculer la date de début selon la période
        let startDate: Date | undefined
        const now = new Date()

        switch (period) {
            case '1m':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                break
            case '3m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
                break
            case '6m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
                break
            case '12m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
                break
            default:
                startDate = undefined
        }

        const where: any = {}
        if (startDate) {
            where.createdAt = { gte: startDate }
        }

        // Statistiques générales
        const [
            totalStats,
            entreeStats,
            sortieStats,
            categoryStats,
            projectStats,
            consultantStats
        ] = await Promise.all([
            // Total général
            prisma.transaction.aggregate({
                where,
                _sum: { amount: true },
                _count: true
            }),

            // Entrées
            prisma.transaction.aggregate({
                where: { ...where, type: 'ENTREE' },
                _sum: { amount: true },
                _count: true
            }),

            // Sorties
            prisma.transaction.aggregate({
                where: { ...where, type: 'SORTIE' },
                _sum: { amount: true },
                _count: true
            }),

            // Par catégorie
            prisma.transaction.groupBy({
                by: ['category', 'type'],
                where,
                _sum: { amount: true },
                _count: true
            }),

            // Par projet
            prisma.transaction.groupBy({
                by: ['projectId'],
                where: { ...where, projectId: { not: null } },
                _sum: { amount: true },
                _count: true,
                orderBy: { _sum: { amount: 'desc' } },
                take: 10
            }),

            // Par consultant
            prisma.transaction.groupBy({
                by: ['consultantId'],
                where: { ...where, consultantId: { not: null } },
                _sum: { amount: true },
                _count: true,
                orderBy: { _sum: { amount: 'desc' } },
                take: 10
            })
        ])

        // Données temporelles pour les graphiques
        const timelineData = []
        let periodsToGenerate: number
        if (groupBy === 'month') {
            periodsToGenerate = period === '1m' ? 1 : period === '3m' ? 3 : period === '6m' ? 6 : 12
        } else if (groupBy === 'week') {
            periodsToGenerate = period === '1m' ? 4 : period === '3m' ? 12 : period === '6m' ? 26 : 52
        } else { // day
            periodsToGenerate = period === '1m' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365
        }
        for (let i = periodsToGenerate - 1; i >= 0; i--) {
            const date = new Date()
            if (groupBy === 'day') {
                date.setDate(date.getDate() - i)
            } else if (groupBy === 'week') {
                date.setDate(date.getDate() - (i * 7))
            } else {
                date.setMonth(date.getMonth() - i)
            }

            const periodStart = new Date(date)
            const periodEnd = new Date(date)

            if (groupBy === 'month') {
                periodStart.setDate(1)
                periodEnd.setMonth(periodEnd.getMonth() + 1)
                periodEnd.setDate(0)
            } else if (groupBy === 'week') {
                const dayOfWeek = periodStart.getDay()
                periodStart.setDate(periodStart.getDate() - dayOfWeek)
                periodEnd.setDate(periodStart.getDate() + 6)
            } else {
                periodEnd.setHours(23, 59, 59, 999)
            }

            const [entrees, sorties] = await Promise.all([
                prisma.transaction.aggregate({
                    where: {
                        type: 'ENTREE',
                        createdAt: {
                            gte: periodStart,
                            lte: periodEnd
                        }
                    },
                    _sum: { amount: true }
                }),
                prisma.transaction.aggregate({
                    where: {
                        type: 'SORTIE',
                        createdAt: {
                            gte: periodStart,
                            lte: periodEnd
                        }
                    },
                    _sum: { amount: true }
                })
            ])

            timelineData.push({
                period: groupBy === 'month' ?
                    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` :
                    groupBy === 'week' ?
                        `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}` :
                        date.toISOString().split('T')[0],
                entrees: entrees._sum.amount || 0,
                sorties: sorties._sum.amount || 0,
                balance: (entrees._sum.amount || 0) - (sorties._sum.amount || 0)
            })
        }

        // Enrichir les données projet et consultant
        const enrichedProjectStats = await Promise.all(
            projectStats.map(async (stat) => {
                const project = await prisma.project.findUnique({
                    where: { id: stat.projectId! },
                    select: { title: true }
                })
                return {
                    ...stat,
                    project: project?.title || 'Projet supprimé'
                }
            })
        )

        const enrichedConsultantStats = await Promise.all(
            consultantStats.map(async (stat) => {
                const consultant = await prisma.consultant.findUnique({
                    where: { id: stat.consultantId! },
                    include: {
                        user: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                })
                return {
                    ...stat,
                    consultant: consultant ?
                        `${consultant.user.firstName} ${consultant.user.lastName}` :
                        'Consultant supprimé'
                }
            })
        )

        return NextResponse.json({
            summary: {
                total: {
                    amount: totalStats._sum.amount || 0,
                    count: totalStats._count
                },
                entrees: {
                    amount: entreeStats._sum.amount || 0,
                    count: entreeStats._count
                },
                sorties: {
                    amount: sortieStats._sum.amount || 0,
                    count: sortieStats._count
                },
                balance: (entreeStats._sum.amount || 0) - (sortieStats._sum.amount || 0)
            },
            categoryBreakdown: categoryStats,
            topProjects: enrichedProjectStats,
            topConsultants: enrichedConsultantStats,
            timeline: timelineData,
            period,
            generatedAt: new Date().toISOString()
        })

    } catch (error) {
        return handleApiError(error)
    }
}
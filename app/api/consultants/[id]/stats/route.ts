import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    const consultant = await prisma.consultant.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!consultant) {
      return NextResponse.json(
        { error: 'Consultant non trouvé' },
        { status: 404 }
      )
    }

    const canView = user.role === 'DIRECTEUR' || consultant.userId === user.id

    if (!canView) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    // Récupérer toutes les tâches du consultant
    const tasks = await prisma.task.findMany({
      where: { assignedUserId: consultant.userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    // Récupérer les transactions (paiements)
    const transactions = await prisma.transaction.findMany({
      where: {
        consultantId: params.id,
        type: 'SORTIE',
        category: 'SALAIRE_CONSULTANT'
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculer les statistiques
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'TERMINE')
    const inProgressTasks = tasks.filter(task => task.status === 'EN_COURS')
    const pendingTasks = tasks.filter(task => task.status === 'A_FAIRE')

    // Statistiques temporelles
    const tasksWithTime = completedTasks.filter(task => task.actualHours && task.estimatedHours)
    const timeAccuracy = tasksWithTime.map(task => {
      const ratio = task.actualHours! / task.estimatedHours
      return Math.min(ratio, 2) // Cap à 200% pour éviter les outliers
    })

    const avgTimeAccuracy = timeAccuracy.length > 0
      ? timeAccuracy.reduce((sum, ratio) => sum + ratio, 0) / timeAccuracy.length
      : 1

    // Revenus
    const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0)
    const paidEarnings = transactions.filter(t => t.isPaid).reduce((sum, t) => sum + t.amount, 0)
    const pendingEarnings = totalEarnings - paidEarnings

    // Projets uniques
    const uniqueProjects = [...new Set(tasks.map(task => task.project.id))]

    // Performance par mois (derniers 12 mois)
    const monthlyStats = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthTasks = tasks.filter(task =>
        task.createdAt >= monthStart && task.createdAt <= monthEnd
      )

      const monthTransactions = transactions.filter(t =>
        t.createdAt >= monthStart && t.createdAt <= monthEnd
      )

      monthlyStats.push({
        month: date.toISOString().substr(0, 7), // YYYY-MM
        tasksCompleted: monthTasks.filter(t => t.status === 'TERMINE').length,
        hoursWorked: monthTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
        earnings: monthTransactions.reduce((sum, t) => sum + t.amount, 0)
      })
    }

    const stats = {
      overview: {
        totalTasks,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        pendingTasks: pendingTasks.length,
        completionRate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
        uniqueProjects: uniqueProjects.length
      },
      performance: {
        timeAccuracy: Math.round(avgTimeAccuracy * 100), // Pourcentage
        reliability: Math.round((2 - avgTimeAccuracy) * 100), // Inverse pour la fiabilité
        avgHoursPerTask: tasksWithTime.length > 0
          ? Math.round(tasksWithTime.reduce((sum, t) => sum + t.actualHours!, 0) / tasksWithTime.length)
          : 0,
        totalHoursWorked: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
      },
      financial: {
        totalEarnings,
        paidEarnings,
        pendingEarnings,
        avgEarningsPerTask: completedTasks.length > 0
          ? Math.round(totalEarnings / completedTasks.length)
          : 0,
        totalTransactions: transactions.length
      },
      timeline: monthlyStats,
      recentTasks: tasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          project: task.project.title,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          createdAt: task.createdAt
        }))
    }

    return NextResponse.json(stats)

  } catch (error) {
    return handleApiError(error)
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTransactionSchema } from '@/lib/validations'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    checkPermission(user.role, ['DIRECTEUR'])

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const type = url.searchParams.get('type')
    const category = url.searchParams.get('category')
    const projectId = url.searchParams.get('projectId')
    const consultantId = url.searchParams.get('consultantId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const isPaid = url.searchParams.get('isPaid')

    const skip = (page - 1) * limit
    const where: any = {}

    if (type) where.type = type
    if (category) where.category = category
    if (projectId) where.projectId = projectId
    if (consultantId) where.consultantId = consultantId
    if (isPaid !== null) where.isPaid = isPaid === 'true'

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          },
          consultant: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({ where })
    ])

    // Calculer les totaux
    const totals = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true
      },
      _count: true
    })

    const entreeTotal = await prisma.transaction.aggregate({
      where: { ...where, type: 'ENTREE' },
      _sum: { amount: true }
    })

    const sortieTotal = await prisma.transaction.aggregate({
      where: { ...where, type: 'SORTIE' },
      _sum: { amount: true }
    })

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalTransactions: totals._count,
        totalAmount: totals._sum.amount || 0,
        totalEntrees: entreeTotal._sum.amount || 0,
        totalSorties: sortieTotal._sum.amount || 0,
        balance: (entreeTotal._sum.amount || 0) - (sortieTotal._sum.amount || 0)
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    checkPermission(user.role, ['DIRECTEUR'])

    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    // Vérifications supplémentaires
    if (validatedData.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId }
      })
      if (!project) {
        return NextResponse.json(
          { error: 'Projet non trouvé' },
          { status: 404 }
        )
      }
    }

    if (validatedData.consultantId) {
      const consultant = await prisma.consultant.findUnique({
        where: { id: validatedData.consultantId }
      })
      if (!consultant) {
        return NextResponse.json(
          { error: 'Consultant non trouvé' },
          { status: 404 }
        )
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        consultant: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    // Créer une notification si c'est un paiement à un consultant
    if (validatedData.consultantId && validatedData.category === 'SALAIRE_CONSULTANT') {
      await prisma.notification.create({
        data: {
          type: 'PAIEMENT',
          title: 'Nouvelle transaction',
          message: `Une transaction de ${validatedData.amount.toLocaleString()} FCFA a été créée: ${validatedData.description}`,
          userId: transaction.consultant!.userId
        }
      })
    }

    return NextResponse.json(transaction, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}
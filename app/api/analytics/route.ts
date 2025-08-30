import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'
import { TaskStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    // Limite au rôle directeur, adapte si besoin
    checkPermission(user.role, ['DIRECTEUR'])

    const [
      projectsTotal,
      tasksTotal,
      tasksTodo,
      tasksDoing,
      tasksDone,
      consultantsTotal,
      unreadCount,
      txEntrees,
      txSorties,
      lastTransactions,
      lastProjects
    ] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: TaskStatus.A_FAIRE } }),
      prisma.task.count({ where: { status: TaskStatus.EN_COURS } }),
      prisma.task.count({ where: { status: TaskStatus.TERMINE } }),
      prisma.consultant.count(),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
      prisma.transaction.aggregate({
        where: { type: 'ENTREE' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'SORTIE' },
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, createdAt: true, status: true }
      })
    ])

    const totalEntrees = txEntrees._sum.amount || 0
    const totalSorties = txSorties._sum.amount || 0

    return NextResponse.json({
      counters: {
        projects: projectsTotal,
        tasks: tasksTotal,
        consultants: consultantsTotal,
        unreadNotifications: unreadCount
      },
      tasks: {
        byStatus: {
          TODO: tasksTodo,
          DOING: tasksDoing,
          DONE: tasksDone
        }
      },
      finance: {
        totalEntrees,
        totalSorties,
        balance: totalEntrees - totalSorties
      },
      recent: {
        transactions: lastTransactions,
        projects: lastProjects
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    return handleApiError(error)
  }
}

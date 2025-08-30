import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    checkPermission(user.role, ['DIRECTEUR'])

    const url = new URL(request.url)
    const idsParam = url.searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Paramètre ids requis' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',').map(id => id.trim())

    if (ids.length !== 2) {
      return NextResponse.json(
        { error: 'Exactement 2 consultants doivent être comparés' },
        { status: 400 }
      )
    }

    const consultants = await prisma.consultant.findMany({
      where: { id: { in: ids } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            createdAt: true
          }
        }
      }
    })

    if (consultants.length !== 2) {
      return NextResponse.json(
        { error: 'Un ou plusieurs consultants non trouvés' },
        { status: 404 }
      )
    }

    // Calculer les statistiques pour chaque consultant
    const comparison = await Promise.all(
      consultants.map(async (consultant) => {
        const tasks = await prisma.task.findMany({
          where: { assignedUserId: consultant.userId },
          include: {
            project: {
              select: { title: true }
            }
          }
        })

        const transactions = await prisma.transaction.findMany({
          where: {
            consultantId: consultant.id,
            type: 'SORTIE',
            category: 'SALAIRE_CONSULTANT'
          }
        })

        const completedTasks = tasks.filter(task => task.status === 'TERMINE')
        const tasksWithTime = completedTasks.filter(task => task.actualHours && task.estimatedHours)

        const timeAccuracy = tasksWithTime.length > 0
          ? tasksWithTime.reduce((sum, task) => sum + (task.actualHours! / task.estimatedHours), 0) / tasksWithTime.length
          : 1

        return {
          consultant,
          stats: {
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
            timeAccuracy: Math.round(timeAccuracy * 100),
            reliability: Math.round((2 - timeAccuracy) * 100),
            totalHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
            totalEarnings: transactions.reduce((sum, t) => sum + t.amount, 0),
            avgTaskDuration: completedTasks.length > 0
              ? Math.round(completedTasks.reduce((sum, t) => {
                  if (t.startDate && t.endDate) {
                    return sum + (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24)
                  }
                  return sum
                }, 0) / completedTasks.length)
              : 0,
            recentProjects: [...new Set(tasks.slice(-5).map(t => t.project.title))]
          }
        }
      })
    )

    return NextResponse.json({
      consultants: comparison,
      comparisonDate: new Date().toISOString()
    })

  } catch (error) {
    return handleApiError(error)
  }
}
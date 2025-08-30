import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    // Vérifier l'accès au projet
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          where: user.role === 'CONSULTANT' ? { assignedUserId: user.id } : undefined
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    const hasAccess = user.role === 'DIRECTEUR' ||
                     project.creatorId === user.id ||
                     project.managerId === user.id ||
                     project.tasks.some(task => task.assignedUserId === user.id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: params.id,
        ...(user.role === 'CONSULTANT' ? { assignedUserId: user.id } : {})
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        subTasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        documents: true
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json(tasks)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { creatorId: true, managerId: true, budget: true, budgetUsed: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    const canCreate = user.role === 'DIRECTEUR' ||
                     project.creatorId === user.id ||
                     project.managerId === user.id

    if (!canCreate) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Vérifier le budget disponible
    const remainingBudget = project.budget - project.budgetUsed
    if (validatedData.budget > remainingBudget) {
      return NextResponse.json(
        { error: 'Budget insuffisant pour cette tâche' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        projectId: params.id,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })

    // Mettre à jour le budget utilisé du projet
    if (validatedData.budget > 0) {
      await prisma.project.update({
        where: { id: params.id },
        data: {
          budgetUsed: {
            increment: validatedData.budget
          }
        }
      })
    }

    // Notification si assigné à quelqu'un
    if (validatedData.assignedUserId && validatedData.assignedUserId !== user.id) {
      await prisma.notification.create({
        data: {
          type: 'ASSIGNATION_TACHE',
          title: 'Nouvelle tâche assignée',
          message: `Vous avez une nouvelle tâche: "${task.title}"`,
          userId: validatedData.assignedUserId,
          entityId: task.id,
          entityType: 'task'
        }
      })
    }

    return NextResponse.json(task, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}
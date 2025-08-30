import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assignTaskSchema } from '@/lib/validations'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)
    checkPermission(user.role, ['DIRECTEUR', 'CONSULTANT'])

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            creatorId: true,
            managerId: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      )
    }

    const canAssign = user.role === 'DIRECTEUR' ||
                     task.project.creatorId === user.id ||
                     task.project.managerId === user.id

    if (!canAssign) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes pour assigner cette tâche' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = assignTaskSchema.parse(body)

    // Vérifier que l'utilisateur à assigner existe et est un consultant
    const assignedUser = await prisma.user.findUnique({
      where: { id: validatedData.assignedUserId },
      include: { consultant: true }
    })

    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    if (assignedUser.role !== 'CONSULTANT') {
      return NextResponse.json(
        { error: 'Seuls les consultants peuvent être assignés aux tâches' },
        { status: 400 }
      )
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        assignedUserId: validatedData.assignedUserId,
        ...(validatedData.estimatedHours && { estimatedHours: validatedData.estimatedHours }),
        ...(validatedData.budget && { budget: validatedData.budget })
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Notification à l'assigné
    await prisma.notification.create({
      data: {
        type: 'ASSIGNATION_TACHE',
        title: 'Nouvelle tâche assignée',
        message: `Vous avez été assigné à la tâche "${task.title}" du projet "${task.project.title}"`,
        userId: validatedData.assignedUserId,
        entityId: task.id,
        entityType: 'task'
      }
    })

    return NextResponse.json(updatedTask)

  } catch (error) {
    return handleApiError(error)
  }
}

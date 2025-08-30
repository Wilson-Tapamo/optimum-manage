import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateTaskStatusSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            creatorId: true,
            managerId: true,
            actualHours: true
          }
        },
        assignedUser: {
          include: {
            consultant: {
              select: { tjm: true }
            }
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

    const canUpdate = user.role === 'DIRECTEUR' ||
                     task.assignedUserId === user.id ||
                     task.project.creatorId === user.id ||
                     task.project.managerId === user.id

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateTaskStatusSchema.parse(body)

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        ...(validatedData.actualHours && { actualHours: validatedData.actualHours }),
        ...(validatedData.status === 'TERMINE' && { endDate: new Date() }),
        ...(validatedData.status === 'EN_COURS' && !task.startDate && { startDate: new Date() })
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Mettre à jour les heures du projet
    if (validatedData.actualHours) {
      const hoursDiff = validatedData.actualHours - task.actualHours
      await prisma.project.update({
        where: { id: task.projectId },
        data: {
          actualHours: {
            increment: hoursDiff
          }
        }
      })
    }

    // Créer une transaction de paiement si la tâche est terminée
    if (validatedData.status === 'TERMINE' && task.assignedUser?.consultant?.tjm) {
      const hoursWorked = validatedData.actualHours || task.actualHours || task.estimatedHours
      const payment = (hoursWorked / 8) * task.assignedUser.consultant.tjm // Conversion heures -> jours

      await prisma.transaction.create({
        data: {
          type: 'SORTIE',
          category: 'SALAIRE_CONSULTANT',
          amount: payment,
          description: `Paiement pour la tâche: ${task.title}`,
          consultantId: task.assignedUser.consultant.id,
          projectId: task.projectId,
          isPaid: false
        }
      })

      // Notification de paiement au consultant
      await prisma.notification.create({
        data: {
          type: 'PAIEMENT',
          title: 'Paiement généré',
          message: `Un paiement de ${payment.toLocaleString()} FCFA a été généré pour la tâche "${task.title}"`,
          userId: task.assignedUserId!
        }
      })
    }

    // Ajouter un commentaire si fourni
    if (validatedData.comment) {
      await prisma.comment.create({
        data: {
          content: validatedData.comment,
          userId: user.id,
          taskId: params.id
        }
      })
    }

    // Notifications
    const notificationRecipients = [
      task.project.creatorId,
      task.project.managerId,
      task.assignedUserId
    ].filter((id, index, arr) => id && id !== user.id && arr.indexOf(id) === index)

    for (const recipientId of notificationRecipients) {
      await prisma.notification.create({
        data: {
          type: 'CHANGEMENT_STATUT',
          title: 'Statut de tâche modifié',
          message: `La tâche "${task.title}" est maintenant "${validatedData.status}"`,
          userId: recipientId,
          entityId: task.id,
          entityType: 'task'
        }
      })
    }

    return NextResponse.json(updatedTask)

  } catch (error) {
    return handleApiError(error)
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'
import { z } from 'zod'

const consultantPaymentSchema = z.object({
  consultantId: z.string(),
  amount: z.number().min(0.01, 'Le montant doit être positif'),
  description: z.string().min(5, 'Description requise'),
  taskIds: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  reference: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    checkPermission(user.role, ['DIRECTEUR'])

    const body = await request.json()
    const validatedData = consultantPaymentSchema.parse(body)

    // Vérifier que le consultant existe
    const consultant = await prisma.consultant.findUnique({
      where: { id: validatedData.consultantId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!consultant) {
      return NextResponse.json(
        { error: 'Consultant non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier les tâches si spécifiées
    let tasks: any[] = []
    if (validatedData.taskIds && validatedData.taskIds.length > 0) {
      tasks = await prisma.task.findMany({
        where: {
          id: { in: validatedData.taskIds },
          assignedUserId: consultant.userId,
          status: 'TERMINE'
        },
        include: {
          project: {
            select: { title: true }
          }
        }
      })

      if (tasks.length !== validatedData.taskIds.length) {
        return NextResponse.json(
          { error: 'Certaines tâches ne sont pas valides ou ne sont pas terminées' },
          { status: 400 }
        )
      }
    }

    // Créer la transaction de paiement
    const transaction = await prisma.transaction.create({
      data: {
        type: 'SORTIE',
        category: 'SALAIRE_CONSULTANT',
        amount: validatedData.amount,
        description: validatedData.description,
        consultantId: validatedData.consultantId,
        reference: validatedData.reference,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        isPaid: false
      }
    })

    // Créer une notification pour le consultant
    await prisma.notification.create({
      data: {
        type: 'PAIEMENT',
        title: 'Nouveau paiement programmé',
        message: `Un paiement de ${validatedData.amount.toLocaleString()} FCFA a été programmé: ${validatedData.description}`,
        userId: consultant.userId,
        entityId: transaction.id,
        entityType: 'transaction'
      }
    })

    // Log d'activité
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'transaction',
        entityId: transaction.id,
        newValues: {
          type: 'PAIEMENT_CONSULTANT',
          consultantId: validatedData.consultantId,
          amount: validatedData.amount
        }
      }
    })

    return NextResponse.json({
      transaction,
      consultant: {
        name: `${consultant.user.firstName} ${consultant.user.lastName}`,
        email: consultant.user.email
      },
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        project: task.project.title,
        actualHours: task.actualHours
      })),
      message: 'Paiement créé avec succès'
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}
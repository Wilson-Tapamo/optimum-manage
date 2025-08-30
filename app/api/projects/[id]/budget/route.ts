import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateBudgetSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { creatorId: true, managerId: true, budget: true, title: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    const canEdit = user.role === 'DIRECTEUR' ||
                   project.creatorId === user.id ||
                   project.managerId === user.id

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateBudgetSchema.parse(body)

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        budget: validatedData.budget
      }
    })

    // Créer une transaction pour le changement de budget
    if (validatedData.budget !== project.budget) {
      const difference = validatedData.budget - project.budget
      await prisma.transaction.create({
        data: {
          type: difference > 0 ? 'ENTREE' : 'SORTIE',
          category: 'REVENUS_PROJET',
          amount: Math.abs(difference),
          description: `Modification budget projet: ${project.title}${validatedData.reason ? ` - ${validatedData.reason}` : ''}`,
          projectId: params.id
        }
      })
    }

    return NextResponse.json(updatedProject)

  } catch (error) {
    return handleApiError(error)
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProjectSchema } from '@/lib/validations'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            subTasks: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
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
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier les permissions
    const hasAccess = user.role === 'DIRECTEUR' ||
                     project.creatorId === user.id ||
                     project.managerId === user.id ||
                     project.tasks.some(task => task.assignedUserId === user.id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Accès non autorisé à ce projet' },
        { status: 403 }
      )
    }

    return NextResponse.json(project)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { creatorId: true, managerId: true }
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
        { error: 'Permissions insuffisantes pour modifier ce projet' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedProject)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)
    checkPermission(user.role, ['DIRECTEUR'])

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { _count: { select: { tasks: true } } }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    if (project._count.tasks > 0) {
      // Soft delete si le projet a des tâches
      await prisma.project.update({
        where: { id: params.id },
        data: { isActive: false }
      })
    } else {
      // Hard delete si pas de tâches
      await prisma.project.delete({
        where: { id: params.id }
      })
    }

    return NextResponse.json({ message: 'Projet supprimé avec succès' })

  } catch (error) {
    return handleApiError(error)
  }
}
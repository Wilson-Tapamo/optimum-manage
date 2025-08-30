import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProjectSchema } from '@/lib/validations'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {}

    // Filtrage par rôle
    if (user.role !== 'DIRECTEUR') {
      where.OR = [
        { creatorId: user.id },
        { managerId: user.id },
        { tasks: { some: { assignedUserId: user.id } } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { clientName: { contains: search } }
      ]
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
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
            select: {
              id: true,
              status: true,
              assignedUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          _count: {
            select: {
              tasks: true,
              comments: true,
              documents: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    checkPermission(user.role, ['DIRECTEUR', 'CONSULTANT'])

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        creatorId: user.id
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

    // Créer une notification pour le manager si assigné
    if (validatedData.managerId && validatedData.managerId !== user.id) {
      await prisma.notification.create({
        data: {
          type: 'ASSIGNATION_TACHE',
          title: 'Nouveau projet assigné',
          message: `Vous avez été assigné comme manager du projet "${project.title}"`,
          userId: validatedData.managerId,
          entityId: project.id,
          entityType: 'project'
        }
      })
    }

    return NextResponse.json(project, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}
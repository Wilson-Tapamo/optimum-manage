import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateConsultantSchema } from '@/lib/validations'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    const consultant = await prisma.consultant.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true
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

    // Les consultants peuvent voir leur propre profil
    const canView = user.role === 'DIRECTEUR' || consultant.userId === user.id

    if (!canView) {
      // Retourner des données limitées pour les autres utilisateurs
      return NextResponse.json({
        id: consultant.id,
        user: {
          firstName: consultant.user.firstName,
          lastName: consultant.user.lastName,
          avatar: consultant.user.avatar
        },
        specialization: consultant.specialization,
        skills: consultant.skills,
        experience: consultant.experience,
        reliability: consultant.reliability,
        isAvailable: consultant.isAvailable
      })
    }

    return NextResponse.json(consultant)

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

    const consultant = await prisma.consultant.findUnique({
      where: { id: params.id },
      select: { userId: true }
    })

    if (!consultant) {
      return NextResponse.json(
        { error: 'Consultant non trouvé' },
        { status: 404 }
      )
    }

    const canUpdate = user.role === 'DIRECTEUR' || consultant.userId === user.id

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateConsultantSchema.parse(body)

    const updatedConsultant = await prisma.consultant.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true
          }
        }
      }
    })

    return NextResponse.json(updatedConsultant)

  } catch (error) {
    return handleApiError(error)
  }
}

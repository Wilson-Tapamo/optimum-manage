import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createConsultantSchema } from '@/lib/validations'
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search')
    const skill = url.searchParams.get('skill')
    const available = url.searchParams.get('available')
    const sortBy = url.searchParams.get('sortBy') || 'reliability'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit
    const where: any = {}

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { specialization: { contains: search } }
      ]
    }

    if (skill) {
      where.skills = {
        array_contains: skill
      }
    }

    if (available === 'true') {
      where.isAvailable = true
    }

    const orderBy: any = {}
    if (sortBy === 'reliability') {
      orderBy.reliability = sortOrder
    } else if (sortBy === 'experience') {
      orderBy.experience = sortOrder
    } else if (sortBy === 'tjm') {
      orderBy.tjm = sortOrder
    } else {
      orderBy.user = { firstName: sortOrder }
    }

    const [consultants, total] = await Promise.all([
      prisma.consultant.findMany({
        where,
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
          },
          _count: {
            select: {
              transactions: true
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.consultant.count({ where })
    ])

    // Calculer les statistiques de performance pour chaque consultant
    const enrichedConsultants = await Promise.all(
      consultants.map(async (consultant) => {
        const tasks = await prisma.task.findMany({
          where: { assignedUserId: consultant.userId },
          select: {
            status: true,
            estimatedHours: true,
            actualHours: true,
            createdAt: true
          }
        })

        const completedTasks = tasks.filter(task => task.status === 'TERMINE')
        const totalTasks = tasks.length
        const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

        // Calculer la fiabilité temporelle
        const reliabilityData = completedTasks
          .filter(task => task.actualHours && task.estimatedHours)
          .map(task => (task.actualHours! / task.estimatedHours) * 100)

        const avgReliability = reliabilityData.length > 0
          ? reliabilityData.reduce((sum, val) => sum + val, 0) / reliabilityData.length
          : 0

        return {
          ...consultant,
          stats: {
            totalTasks,
            completedTasks: completedTasks.length,
            completionRate: Math.round(completionRate),
            avgReliability: Math.round(avgReliability),
            totalEarnings: await prisma.transaction.aggregate({
              where: {
                consultantId: consultant.id,
                type: 'SORTIE',
                category: 'SALAIRE_CONSULTANT'
              },
              _sum: { amount: true }
            }).then(result => result._sum.amount || 0)
          }
        }
      })
    )

    return NextResponse.json({
      consultants: enrichedConsultants,
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
    checkPermission(user.role, ['DIRECTEUR'])

    const body = await request.json()
    const validatedData = createConsultantSchema.parse(body)

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Créer l'utilisateur et le consultant en transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          role: 'CONSULTANT'
        }
      })

      const newConsultant = await tx.consultant.create({
        data: {
          userId: newUser.id,
          tjm: validatedData.tjm,
          specialization: validatedData.specialization,
          skills: validatedData.skills,
          experience: validatedData.experience,
          biography: validatedData.biography,
          dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
          address: validatedData.address,
          emergencyContact: validatedData.emergencyContact
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true
            }
          }
        }
      })

      return { newUser, newConsultant, tempPassword }
    })

    // TODO: Envoyer un email avec le mot de passe temporaire
    console.log(`Mot de passe temporaire pour ${validatedData.email}: ${result.tempPassword}`)

    return NextResponse.json({
      consultant: result.newConsultant,
      message: 'Consultant créé avec succès',
      tempPassword: result.tempPassword // À supprimer en production
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}
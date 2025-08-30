// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  role: z.enum(['DIRECTEUR', 'CONSULTANT', 'CLIENT']).optional(),
  tjm: z.number().optional(),
  specialization: z.string().optional(),
  skills: z.array(z.string()).optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: validatedData.role || 'CONSULTANT',
      }
    })

    // Si c'est un consultant, créer le profil consultant
    if (user.role === 'CONSULTANT') {
      await prisma.consultant.create({
        data: {
          userId: user.id,
          tjm: validatedData.tjm || 0,
          specialization: validatedData.specialization || '',
          skills: validatedData.skills || [],
          experience: 0,
        }
      })
    }

    // Retourner l'utilisateur (sans mot de passe)
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Utilisateur créé avec succès',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
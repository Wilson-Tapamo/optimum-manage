import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export function handleApiError(error: any) {
  console.error('API Error:', error)

  if (error.message === 'Non authentifié') {
    return NextResponse.json(
      { error: 'Authentification requise' },
      { status: 401 }
    )
  }

  if (error.message === 'Permissions insuffisantes' || error.message === 'Compte désactivé') {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cette ressource existe déjà' },
        { status: 409 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Erreur interne du serveur' },
    { status: 500 }
  )
}
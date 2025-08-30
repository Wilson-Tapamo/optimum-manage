import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
      select: { userId: true, isRead: true }
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      )
    }

    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé à cette notification' },
        { status: 403 }
      )
    }

    if (notification.isRead) {
      return NextResponse.json(
        { message: 'Notification déjà marquée comme lue' }
      )
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({
      notification: updatedNotification,
      message: 'Notification marquée comme lue'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

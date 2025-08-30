import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { handleApiError } from '@/lib/response-utils'

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({
      message: `${result.count} notifications marquées comme lues`,
      count: result.count
    })

  } catch (error) {
    return handleApiError(error)
  }
}
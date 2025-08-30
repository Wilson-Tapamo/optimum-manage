import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole } from '@prisma/client'

export async function getAuthenticatedUser(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Non authentifié')
  }

  if (!session.user.isActive) {
    throw new Error('Compte désactivé')
  }

  return session.user
}

export function checkPermission(userRole: UserRole, requiredRoles: UserRole[]) {
  if (!requiredRoles.includes(userRole)) {
    throw new Error('Permissions insuffisantes')
  }
}
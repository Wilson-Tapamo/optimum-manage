import { UserRole } from '@prisma/client'

export const hasPermission = (userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean => {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole)
  }

  // Hiérarchie des rôles
  const roleHierarchy = {
    DIRECTEUR: 3,
    CONSULTANT: 2,
    CLIENT: 1
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export const canAccessFinances = (userRole: UserRole): boolean => {
  return userRole === 'DIRECTEUR'
}

export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'DIRECTEUR'
}

export const canManageAllProjects = (userRole: UserRole): boolean => {
  return userRole === 'DIRECTEUR'
}

export const canViewProject = (userRole: UserRole, isAssigned: boolean): boolean => {
  return userRole === 'DIRECTEUR' || isAssigned
}
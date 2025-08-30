import { prisma } from './prisma'
import { NotificationType } from '@prisma/client'

interface CreateNotificationData {
  type: NotificationType
  title: string
  message: string
  userId: string
  entityId?: string
  entityType?: string
  actionUrl?: string
}

export class NotificationService {
  static async create(data: CreateNotificationData) {
    return await prisma.notification.create({
      data
    })
  }

  static async createBulk(notifications: CreateNotificationData[]) {
    return await prisma.notification.createMany({
      data: notifications
    })
  }

  static async notifyTaskAssignment(taskId: string, assignedUserId: string, taskTitle: string, projectTitle: string) {
    return this.create({
      type: 'ASSIGNATION_TACHE',
      title: 'Nouvelle tâche assignée',
      message: `Vous avez été assigné à la tâche "${taskTitle}" du projet "${projectTitle}"`,
      userId: assignedUserId,
      entityId: taskId,
      entityType: 'task',
      actionUrl: `/tasks/${taskId}`
    })
  }

  static async notifyTaskStatusChange(taskId: string, recipientIds: string[], taskTitle: string, newStatus: string) {
    const notifications = recipientIds.map(userId => ({
      type: 'CHANGEMENT_STATUT' as NotificationType,
      title: 'Statut de tâche modifié',
      message: `La tâche "${taskTitle}" est maintenant "${newStatus}"`,
      userId,
      entityId: taskId,
      entityType: 'task',
      actionUrl: `/tasks/${taskId}`
    }))

    return this.createBulk(notifications)
  }

  static async notifyBudgetExceeded(projectId: string, recipientIds: string[], projectTitle: string, percentage: number) {
    const notifications = recipientIds.map(userId => ({
      type: 'DEPASSEMENT_BUDGET' as NotificationType,
      title: 'Dépassement de budget',
      message: `Le projet "${projectTitle}" a dépassé ${percentage}% de son budget`,
      userId,
      entityId: projectId,
      entityType: 'project',
      actionUrl: `/projects/${projectId}`
    }))

    return this.createBulk(notifications)
  }

  static async notifyDeadlineApproaching(taskId: string, assignedUserId: string, taskTitle: string, daysLeft: number) {
    return this.create({
      type: 'DEADLINE_PROCHE',
      title: 'Échéance proche',
      message: `La tâche "${taskTitle}" doit être terminée dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
      userId: assignedUserId,
      entityId: taskId,
      entityType: 'task',
      actionUrl: `/tasks/${taskId}`
    })
  }

  static async notifyPayment(consultantUserId: string, amount: number, description: string) {
    return this.create({
      type: 'PAIEMENT',
      title: 'Paiement généré',
      message: `Un paiement de ${amount.toLocaleString()} FCFA a été généré: ${description}`,
      userId: consultantUserId,
      actionUrl: '/consultant/payments'
    })
  }
}    return NextResponse.json(task, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}
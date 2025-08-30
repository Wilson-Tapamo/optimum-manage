import { z } from 'zod'
import { ProjectStatus, TaskStatus, Priority, TransactionType, TransactionCategory, NotificationType } from '@prisma/client'

// Validation des projets
export const createProjectSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  budget: z.number().min(0, 'Le budget doit être positif'),
  estimatedHours: z.number().min(1, 'Les heures estimées doivent être supérieures à 0'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  deadline: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  priority: z.nativeEnum(Priority).default('MOYENNE'),
  managerId: z.string().optional()
})

export const updateProjectSchema = createProjectSchema.partial()

export const updateBudgetSchema = z.object({
  budget: z.number().min(0, 'Le budget doit être positif'),
  reason: z.string().optional()
})

// Validation des tâches
export const createTaskSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(5, 'La description doit contenir au moins 5 caractères'),
  budget: z.number().min(0, 'Le budget doit être positif').default(0),
  estimatedHours: z.number().min(1, 'Les heures estimées doivent être supérieures à 0'),
  deadline: z.string().optional(),
  priority: z.nativeEnum(Priority).default('MOYENNE'),
  assignedUserId: z.string().optional(),
  parentTaskId: z.string().optional()
})

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  actualHours: z.number().min(0).optional(),
  comment: z.string().optional()
})

export const assignTaskSchema = z.object({
  assignedUserId: z.string(),
  estimatedHours: z.number().min(1).optional(),
  budget: z.number().min(0).optional()
})

// Validation des consultants
export const createConsultantSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  tjm: z.number().min(0, 'Le TJM doit être positif'),
  specialization: z.string().min(3, 'La spécialisation doit contenir au moins 3 caractères'),
  skills: z.array(z.string()).min(1, 'Au moins une compétence est requise'),
  experience: z.number().min(0, 'L\'expérience doit être positive').default(0),
  biography: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional()
})

export const updateConsultantSchema = z.object({
  tjm: z.number().min(0).optional(),
  specialization: z.string().min(3).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.number().min(0).optional(),
  biography: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  isAvailable: z.boolean().optional()
})

// Validation des transactions
export const createTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  amount: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
  description: z.string().min(5, 'La description doit contenir au moins 5 caractères'),
  reference: z.string().optional(),
  projectId: z.string().optional(),
  consultantId: z.string().optional(),
  dueDate: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.string().optional()
})
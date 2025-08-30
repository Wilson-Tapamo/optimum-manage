// Fichier: src/app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, checkPermission } from '@/lib/auth-utils';
import { handleApiError } from '@/lib/response-utils';
import { TaskStatus, Priority } from '@prisma/client';
import { z } from 'zod';

// --- SCHEMA DE VALIDATION (BONNE PRATIQUE) ---
// Ce schéma valide les données entrantes pour la création de tâches
const createTaskSchema = z.object({
  title: z.string().min(3, { message: "Le titre doit faire au moins 3 caractères." }),
  description: z.string().optional(),
  projectId: z.string().cuid({ message: "ID de projet invalide." }),
  priority: z.nativeEnum(Priority).optional().default('MOYENNE'),
  assignedUserId: z.string().cuid({ message: "ID de consultant invalide." }).optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().positive().optional(),
  budget: z.number().positive().optional(),
});

// --- VOTRE FONCTION GET EXISTANTE (INCHANGÉE) ---
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') as TaskStatus | null;
    const priority = url.searchParams.get('priority') as Priority | null;
    const projectId = url.searchParams.get('projectId') || undefined;
    const assignedToMe = url.searchParams.get('assignedToMe') === 'true';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * limit;
    const where: any = {};

    if (user.role !== 'DIRECTEUR') {
      where.OR = [
        { assignedUserId: user.id },
        { project: { creatorId: user.id } },
        { project: { managerId: user.id } }
      ];
    }

    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assignedToMe) where.assignedUserId = user.id;

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          project: { select: { id: true, title: true, status: true } },
          _count: { select: { comments: true, documents: true, subTasks: true } }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.task.count({ where })
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// --- NOUVELLE FONCTION POST (RÉSOUT L'ERREUR 405) ---
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    // Seuls les directeurs ou consultants peuvent créer des tâches (adaptez si besoin)
    checkPermission(user.role, ['DIRECTEUR', 'CONSULTANT']);

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: { creatorId: true, managerId: true }
    });

    if (!project) {
        return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Vérifier les permissions de création sur ce projet spécifique
    const canCreate = user.role === 'DIRECTEUR' || project.creatorId === user.id || project.managerId === user.id;
    if (!canCreate) {
        return NextResponse.json({ error: "Permissions insuffisantes pour créer une tâche sur ce projet" }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        assignedUserId: validatedData.assignedUserId || null,
      },
    });

    

    return NextResponse.json(task, { status: 201 });

  } catch (error) {
    // La gestion d'erreur de Zod sera attrapée ici
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
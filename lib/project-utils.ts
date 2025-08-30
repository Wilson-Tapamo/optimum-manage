import { Project } from '@/hooks/useProjects';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
};

export const formatRelativeDate = (date: string | Date): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return "Demain";
  } else if (diffDays <= 7) {
    return `Dans ${diffDays} jours`;
  } else {
    return formatDate(date);
  }
};

export const getProjectHealth = (project: Project): {
  score: number;
  label: string;
  color: string;
  issues: string[];
} => {
  const issues: string[] = [];
  let score = 100;

  // Vérifier le budget
  const budgetUsage = project.budget > 0 ? (project.budgetUsed / project.budget) * 100 : 0;
  if (budgetUsage > 100) {
    score -= 30;
    issues.push('Budget dépassé');
  } else if (budgetUsage > 80) {
    score -= 15;
    issues.push('Budget presque épuisé');
  }

  // Vérifier les délais
  if (project.deadline) {
    const deadline = new Date(project.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) {
      score -= 40;
      issues.push('Échéance dépassée');
    } else if (daysUntilDeadline <= 3) {
      score -= 20;
      issues.push('Échéance très proche');
    } else if (daysUntilDeadline <= 7) {
      score -= 10;
      issues.push('Échéance proche');
    }
  }

  // Vérifier la progression
  const completedTasks = project.tasks.filter(t => t.status === 'TERMINE').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (progress < 25 && project.status === 'EN_COURS') {
    score -= 15;
    issues.push('Progression lente');
  }

  // Vérifier les heures
  const timeUsage = project.estimatedHours > 0 ? (project.actualHours / project.estimatedHours) * 100 : 0;
  if (timeUsage > 120) {
    score -= 20;
    issues.push('Temps dépassé');
  }

  // Déterminer le label et la couleur
  let label: string;
  let color: string;

  if (score >= 80) {
    label = 'Excellent';
    color = 'text-green-600';
  } else if (score >= 60) {
    label = 'Bon';
    color = 'text-blue-600';
  } else if (score >= 40) {
    label = 'Attention';
    color = 'text-yellow-600';
  } else {
    label = 'Critique';
    color = 'text-red-600';
  }

  return { score: Math.max(score, 0), label, color, issues };
};

export const getProjectPriority = (priority: string): {
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
} => {
  switch (priority) {
    case 'FAIBLE':
      return {
        label: 'Faible',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        emoji: '🟢'
      };
    case 'MOYENNE':
      return {
        label: 'Moyenne',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        emoji: '🔵'
      };
    case 'HAUTE':
      return {
        label: 'Haute',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
        emoji: '🟠'
      };
    case 'CRITIQUE':
      return {
        label: 'Critique',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        emoji: '🔴'
      };
    default:
      return {
        label: priority,
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        emoji: '⚪'
      };
  }
};

export const calculateProjectROI = (project: Project): number => {
  if (project.budgetUsed === 0) return 0;
  
  // ROI simplifié basé sur le budget vs coût réel
  const estimatedCost = project.budgetUsed;
  const revenue = project.budget;
  
  return ((revenue - estimatedCost) / estimatedCost) * 100;
};

export const getProjectTeam = (project: Project): {
  totalMembers: number;
  uniqueMembers: string[];
  manager?: string;
} => {
  const assignedUsers = project.tasks
    .filter(task => task.assignedUser)
    .map(task => `${task.assignedUser!.firstName} ${task.assignedUser!.lastName}`);
  
  const uniqueMembers = Array.from(new Set(assignedUsers));
  
  const manager = project.manager 
    ? `${project.manager.firstName} ${project.manager.lastName}`
    : undefined;

  return {
    totalMembers: uniqueMembers.length + (manager && !uniqueMembers.includes(manager) ? 1 : 0),
    uniqueMembers,
    manager
  };
};

export const getTimeRemaining = (deadline: string | null): {
  days: number;
  isOverdue: boolean;
  isUrgent: boolean;
  label: string;
} => {
  if (!deadline) {
    return {
      days: Infinity,
      isOverdue: false,
      isUrgent: false,
      label: 'Pas de deadline'
    };
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isUrgent = diffDays <= 7 && diffDays >= 0;

  let label: string;
  if (isOverdue) {
    label = `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    label = "Échéance aujourd'hui";
  } else if (diffDays === 1) {
    label = "Échéance demain";
  } else if (diffDays <= 7) {
    label = `${diffDays} jours restants`;
  } else if (diffDays <= 30) {
    label = `${diffDays} jours restants`;
  } else {
    const weeks = Math.ceil(diffDays / 7);
    label = `${weeks} semaine${weeks > 1 ? 's' : ''} restantes`;
  }

  return {
    days: diffDays,
    isOverdue,
    isUrgent,
    label
  };
};

export const sortProjects = (projects: Project[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): Project[] => {
  const sorted = [...projects].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'budget':
        comparison = a.budget - b.budget;
        break;
      case 'progress':
        const progressA = a.tasks.length > 0 ? (a.tasks.filter(t => t.status === 'TERMINE').length / a.tasks.length) * 100 : 0;
        const progressB = b.tasks.length > 0 ? (b.tasks.filter(t => t.status === 'TERMINE').length / b.tasks.length) * 100 : 0;
        comparison = progressA - progressB;
        break;
      case 'deadline':
        if (!a.deadline && !b.deadline) comparison = 0;
        else if (!a.deadline) comparison = 1;
        else if (!b.deadline) comparison = -1;
        else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

export const getProjectStatusStats = (projects: Project[]) => {
  const stats = {
    'A_FAIRE': { count: 0, percentage: 0 },
    'EN_COURS': { count: 0, percentage: 0 },
    'TERMINE': { count: 0, percentage: 0 },
    'SUSPENDU': { count: 0, percentage: 0 }
  };

  projects.forEach(project => {
    stats[project.status].count++;
  });

  const total = projects.length;
  Object.keys(stats).forEach(status => {
    stats[status as keyof typeof stats].percentage = total > 0 
      ? Math.round((stats[status as keyof typeof stats].count / total) * 100)
      : 0;
  });

  return stats;
};

export const getBudgetAnalysis = (projects: Project[]) => {
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalUsed = projects.reduce((sum, p) => sum + p.budgetUsed, 0);
  const overBudgetProjects = projects.filter(p => p.budgetUsed > p.budget);
  
  return {
    totalBudget,
    totalUsed,
    remaining: totalBudget - totalUsed,
    utilizationRate: totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0,
    overBudgetCount: overBudgetProjects.length,
    averageBudget: projects.length > 0 ? totalBudget / projects.length : 0,
    highestBudget: Math.max(...projects.map(p => p.budget), 0),
    lowestBudget: Math.min(...projects.map(p => p.budget), 0)
  };
};

export const validateProjectData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('La description doit contenir au moins 10 caractères');
  }

  if (!data.budget || parseFloat(data.budget) <= 0) {
    errors.push('Le budget doit être supérieur à 0');
  }

  if (!data.estimatedHours || parseFloat(data.estimatedHours) <= 0) {
    errors.push('Les heures estimées doivent être supérieures à 0');
  }

  if (data.deadline) {
    const deadline = new Date(data.deadline);
    const now = new Date();
    if (deadline < now) {
      errors.push('La date limite ne peut pas être dans le passé');
    }
  }

  if (data.clientEmail && !isValidEmail(data.clientEmail)) {
    errors.push('L\'email du client n\'est pas valide');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateProjectCode = (title: string): string => {
  // Générer un code projet basé sur le titre
  const words = title.trim().split(' ');
  const code = words
    .slice(0, 3)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  // Ajouter des chiffres aléatoires
  const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${code}${randomNum}`;
};

export const getProjectEfficiency = (project: Project): {
  timeEfficiency: number;
  budgetEfficiency: number;
  overallEfficiency: number;
  rating: string;
} => {
  // Efficacité temporelle
  const timeEfficiency = project.estimatedHours > 0 
    ? Math.max(0, 100 - ((project.actualHours - project.estimatedHours) / project.estimatedHours) * 100)
    : 100;

  // Efficacité budgétaire
  const budgetEfficiency = project.budget > 0
    ? Math.max(0, 100 - ((project.budgetUsed - project.budget) / project.budget) * 100)
    : 100;

  // Efficacité globale (moyenne pondérée)
  const overallEfficiency = (timeEfficiency * 0.4 + budgetEfficiency * 0.6);

  // Rating
  let rating: string;
  if (overallEfficiency >= 90) rating = 'Excellent';
  else if (overallEfficiency >= 75) rating = 'Très bon';
  else if (overallEfficiency >= 60) rating = 'Bon';
  else if (overallEfficiency >= 40) rating = 'Passable';
  else rating = 'Problématique';

  return {
    timeEfficiency: Math.round(timeEfficiency),
    budgetEfficiency: Math.round(budgetEfficiency),
    overallEfficiency: Math.round(overallEfficiency),
    rating
  };
};
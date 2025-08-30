import { useState, useEffect } from 'react';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'SUSPENDU';
  budget: number;
  budgetUsed: number;
  estimatedHours: number;
  actualHours: number;
  deadline: string | null;
  createdAt: string;
  clientName?: string;
  priority: 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
  creator: {
    firstName: string;
    lastName: string;
  };
  manager?: {
    firstName: string;
    lastName: string;
  };
  tasks: Array<{
    id: string;
    status: string;
    assignedUser?: {
      firstName: string;
      lastName: string;
    };
  }>;
  _count: {
    tasks: number;
    comments: number;
  };
}

export interface ProjectFilters {
  search: string;
  status: string;
  consultant: string;
  budget: string;
}

export interface CreateProjectData {
  title: string;
  description: string;
  budget: number;
  estimatedHours: number;
  deadline?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  priority: string;
  managerId?: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async (filters: Partial<ProjectFilters> = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/projects?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des projets');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: CreateProjectData): Promise<boolean> => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      await fetchProjects();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      return false;
    }
  };

  const updateProject = async (projectId: string, projectData: Partial<CreateProjectData>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      await fetchProjects();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      return false;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      await fetchProjects();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      return false;
    }
  };

  const updateBudget = async (projectId: string, budget: number, reason?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du budget');
      }

      await fetchProjects();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du budget');
      return false;
    }
  };

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    updateBudget
  };
};
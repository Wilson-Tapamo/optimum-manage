import { useState, useEffect } from 'react';

export interface Consultant {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    isActive: boolean;
  };
  specialization: string;
  skills: string[];
  experience: number;
  tjm: number;
  reliability: number;
  isAvailable: boolean;
  biography?: string;
  stats?: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalEarnings: number;
  };
}

export interface ConsultantFilters {
  search: string;
  skill: string;
  available: boolean | null;
  sortBy: string;
  sortOrder: string;
}

export const useConsultants = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultants = async (filters: Partial<ConsultantFilters> = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/consultants?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des consultants');
      }

      const data = await response.json();
      setConsultants(data.consultants || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableConsultants = () => {
    return consultants.filter(consultant => consultant.isAvailable && consultant.user.isActive);
  };

  const getConsultantById = (id: string) => {
    return consultants.find(consultant => consultant.id === id);
  };

  const getConsultantStats = async (consultantId: string) => {
    try {
      const response = await fetch(`/api/consultants/${consultantId}/stats`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }

      return await response.json();
    } catch (err) {
      console.error('Erreur stats consultant:', err);
      return null;
    }
  };

  return {
    consultants,
    loading,
    error,
    fetchConsultants,
    getAvailableConsultants,
    getConsultantById,
    getConsultantStats
  };
};
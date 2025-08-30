'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Calendar,
    DollarSign,
    Users,
    Clock,
    MoreVertical,
    Edit3,
    Trash2,
    User,
    AlertCircle,
    CheckCircle,
    PlayCircle,
    PauseCircle,
    X,
    ChevronDown,
    TrendingUp,
    Eye,
    UserPlus
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';
// Types
interface Project {
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

interface Consultant {
    id: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    specialization: string;
    tjm: number;
    isAvailable: boolean;
}

const ProjectsPage = () => {
    const { addToast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        consultant: '',
        budget: ''
    });

    // États du formulaire
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        estimatedHours: '',
        deadline: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        priority: 'MOYENNE',
        managerId: ''
    });

    const [assignData, setAssignData] = useState({
        consultantId: '',
        role: 'MANAGER'
    });

    useEffect(() => {
        fetchProjects();
        fetchConsultants();
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [filters]);

    const openDetailsModal = (project: Project) => {
        setSelectedProject(project);
        setIsDetailsModalOpen(true);
    };

    const fetchProjects = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('status', filters.status);

            const response = await fetch(`/api/projects?${params}`);

            if (!response.ok) {
                throw new Error('Erreur lors du chargement');
            }

            const data = await response.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
            addToast({
                type: 'error',
                title: 'Erreur de chargement',
                message: 'Impossible de charger les projets'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchConsultants = async () => {
        try {
            const response = await fetch('/api/consultants');

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des consultants');
            }

            const data = await response.json();
            setConsultants(data.consultants || []);
        } catch (error) {
            console.error('Erreur lors du chargement des consultants:', error);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    budget: parseFloat(formData.budget),
                    estimatedHours: parseFloat(formData.estimatedHours),
                    managerId: formData.managerId || undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création');
            }

            setShowCreateModal(false);
            resetForm();
            fetchProjects();

            addToast({
                type: 'success',
                title: 'Projet créé',
                message: `Le projet "${formData.title}" a été créé avec succès`
            });
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            addToast({
                type: 'error',
                title: 'Erreur de création',
                message: error instanceof Error ? error.message : 'Une erreur est survenue'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;

        setSubmitting(true);

        try {
            const response = await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    budget: parseFloat(formData.budget),
                    estimatedHours: parseFloat(formData.estimatedHours),
                    managerId: formData.managerId || undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour');
            }

            setShowEditModal(false);
            setSelectedProject(null);
            resetForm();
            fetchProjects();

            addToast({
                type: 'success',
                title: 'Projet mis à jour',
                message: 'Les modifications ont été enregistrées'
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            addToast({
                type: 'error',
                title: 'Erreur de mise à jour',
                message: error instanceof Error ? error.message : 'Une erreur est survenue'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) return;

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la suppression');
            }

            fetchProjects();
            addToast({
                type: 'success',
                title: 'Projet supprimé',
                message: `Le projet "${project.title}" a été supprimé`
            });
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            addToast({
                type: 'error',
                title: 'Erreur de suppression',
                message: error instanceof Error ? error.message : 'Une erreur est survenue'
            });
        }
    };

    const handleAssignConsultant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;

        setSubmitting(true);

        try {
            const response = await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    managerId: assignData.consultantId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'assignation');
            }

            const consultant = consultants.find(c => c.id === assignData.consultantId);

            setShowAssignModal(false);
            setSelectedProject(null);
            setAssignData({ consultantId: '', role: 'MANAGER' });
            fetchProjects();

            addToast({
                type: 'success',
                title: 'Consultant assigné',
                message: `${consultant?.user.firstName} ${consultant?.user.lastName} est maintenant manager du projet`
            });
        } catch (error) {
            console.error('Erreur lors de l\'assignation:', error);
            addToast({
                type: 'error',
                title: 'Erreur d\'assignation',
                message: error instanceof Error ? error.message : 'Une erreur est survenue'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            budget: '',
            estimatedHours: '',
            deadline: '',
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            priority: 'MOYENNE',
            managerId: ''
        });
    };

    const openEditModal = (project: Project) => {
        setSelectedProject(project);
        setFormData({
            title: project.title,
            description: project.description,
            budget: project.budget.toString(),
            estimatedHours: project.estimatedHours.toString(),
            deadline: project.deadline ? project.deadline.split('T')[0] : '',
            clientName: project.clientName || '',
            clientEmail: '',
            clientPhone: '',
            priority: project.priority,
            managerId: project.manager?.firstName || ''
        });
        setShowEditModal(true);
    };

    const openAssignModal = (project: Project) => {
        setSelectedProject(project);
        setShowAssignModal(true);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'A_FAIRE': return <Clock className="w-4 h-4 text-gray-500" />;
            case 'EN_COURS': return <PlayCircle className="w-4 h-4 text-blue-500" />;
            case 'TERMINE': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'SUSPENDU': return <PauseCircle className="w-4 h-4 text-yellow-500" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'A_FAIRE': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'EN_COURS': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'TERMINE': return 'bg-green-100 text-green-700 border-green-200';
            case 'SUSPENDU': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'A_FAIRE': return 'À faire';
            case 'EN_COURS': return 'En cours';
            case 'TERMINE': return 'Terminé';
            case 'SUSPENDU': return 'Suspendu';
            default: return status;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'FAIBLE': return 'bg-gray-500';
            case 'MOYENNE': return 'bg-blue-500';
            case 'HAUTE': return 'bg-orange-500';
            case 'CRITIQUE': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const calculateProgress = (project: Project) => {
        const completedTasks = project.tasks.filter(task => task.status === 'TERMINE').length;
        const totalTasks = project.tasks.length;
        return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    };

    const calculateBudgetProgress = (project: Project) => {
        return project.budget > 0 ? (project.budgetUsed / project.budget) * 100 : 0;
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = !filters.search ||
            project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            project.description.toLowerCase().includes(filters.search.toLowerCase()) ||
            project.clientName?.toLowerCase().includes(filters.search.toLowerCase());

        const matchesStatus = !filters.status || project.status === filters.status;

        const matchesConsultant = !filters.consultant ||
            project.tasks.some(task =>
                task.assignedUser &&
                `${task.assignedUser.firstName} ${task.assignedUser.lastName}`.toLowerCase().includes(filters.consultant.toLowerCase())
            ) ||
            (project.manager &&
                `${project.manager.firstName} ${project.manager.lastName}`.toLowerCase().includes(filters.consultant.toLowerCase())
            );

        const matchesBudget = !filters.budget || (() => {
            if (filters.budget === '0-50000') return project.budget <= 50000;
            if (filters.budget === '50000-200000') return project.budget > 50000 && project.budget <= 200000;
            if (filters.budget === '200000-500000') return project.budget > 200000 && project.budget <= 500000;
            if (filters.budget === '500000+') return project.budget > 500000;
            return true;
        })();

        return matchesSearch && matchesStatus && matchesConsultant && matchesBudget;
    });

    const getProjectStats = () => {
        return {
            total: projects.length,
            active: projects.filter(p => p.status === 'EN_COURS').length,
            completed: projects.filter(p => p.status === 'TERMINE').length,
            suspended: projects.filter(p => p.status === 'SUSPENDU').length,
            totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
            totalUsed: projects.reduce((sum, p) => sum + p.budgetUsed, 0)
        };
    };

    const stats = getProjectStats();

    if (loading) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Projets</h1>
                    <p className="text-gray-600">Gérez vos projets et suivez leur progression en temps réel</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 lg:mt-0 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nouveau projet
                </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Projets</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-green-600 mt-1">+2 ce mois</p>
                        </div>
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-7 h-7 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">En cours</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                            <p className="text-xs text-blue-600 mt-1">Actifs</p>
                        </div>
                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                            <PlayCircle className="w-7 h-7 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Budget Total</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {(stats.totalBudget / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-purple-600 mt-1">FCFA</p>
                        </div>
                        <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-7 h-7 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Terminés</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                            <p className="text-xs text-orange-600 mt-1">
                                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% succès
                            </p>
                        </div>
                        <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
                <div className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">Filtres</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Rechercher un projet..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>

                        <select
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="A_FAIRE">À faire</option>
                            <option value="EN_COURS">En cours</option>
                            <option value="TERMINE">Terminé</option>
                            <option value="SUSPENDU">Suspendu</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Consultant assigné..."
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            value={filters.consultant}
                            onChange={(e) => setFilters({ ...filters, consultant: e.target.value })}
                        />

                        <select
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            value={filters.budget}
                            onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                        >
                            <option value="">Toutes les gammes</option>
                            <option value="0-50000">0 - 50k FCFA</option>
                            <option value="50000-200000">50k - 200k FCFA</option>
                            <option value="200000-500000">200k - 500k FCFA</option>
                            <option value="500000+">500k+ FCFA</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Liste des projets */}
            {filteredProjects.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun projet trouvé</h3>
                    <p className="text-gray-600 mb-6">
                        {projects.length === 0
                            ? "Commencez par créer votre premier projet pour organiser votre travail"
                            : "Essayez d'ajuster vos filtres ou créez un nouveau projet"
                        }
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Créer un projet
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => {
                        const progress = calculateProgress(project);
                        const budgetProgress = calculateBudgetProgress(project);
                        const isOverBudget = budgetProgress > 100;
                        const isNearDeadline = project.deadline &&
                            new Date(project.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

                        return (
                            <div key={project.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                                <div className="p-6">
                                    {/* Header avec dropdown */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                    {project.title}
                                                </h3>
                                                <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority)}`}></div>
                                                {isNearDeadline && (
                                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{project.description}</p>
                                        </div>

                                        <div className="relative">
                                            <button
                                                onClick={() => setDropdownOpen(dropdownOpen === project.id ? null : project.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>

                                            {dropdownOpen === project.id && (
                                                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-40 min-w-48">
                                                    <button
                                                        onClick={() => {
                                                            setDropdownOpen(null);
                                                            openEditModal(project);
                                                        }}
                                                        className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                                                    >
                                                        <Edit3 className="w-4 h-4 text-gray-400" />
                                                        <span>Modifier le projet</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDropdownOpen(null);
                                                            openAssignModal(project);
                                                        }}
                                                        className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                                                    >
                                                        <UserPlus className="w-4 h-4 text-gray-400" />
                                                        <span>Assigner consultant</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDropdownOpen(null);
                                                            // Navigation vers détails
                                                            openDetailsModal(project);
                                                        }}
                                                        className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-400" />
                                                        <span>Voir les détails</span>
                                                    </button>
                                                    <hr className="my-2" />
                                                    <button
                                                        onClick={() => {
                                                            setDropdownOpen(null);
                                                            handleDeleteProject(project.id);
                                                        }}
                                                        className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-red-50 w-full text-left text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        <span>Supprimer</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Statut et badges */}
                                    <div className="flex items-center space-x-2 mb-6">
                                        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}>
                                            {getStatusIcon(project.status)}
                                            <span>{getStatusLabel(project.status)}</span>
                                        </div>
                                        {isOverBudget && (
                                            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                <TrendingUp className="w-3 h-3" />
                                                <span>Dépassement</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Métriques principales */}
                                    <div className="space-y-5">
                                        {/* Progression des tâches */}
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-gray-600 font-medium">Progression des tâches</span>
                                                <span className="font-bold text-gray-900">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                                <span>{project.tasks.filter(t => t.status === 'TERMINE').length}/{project._count.tasks} tâches</span>
                                                <span>{project._count.comments} commentaires</span>
                                            </div>
                                        </div>

                                        {/* Budget */}
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-gray-600 font-medium">Utilisation budget</span>
                                                <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {Math.round(budgetProgress)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${isOverBudget
                                                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                                                            : 'bg-gradient-to-r from-green-500 to-green-600'
                                                        }`}
                                                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                                <span>{project.budgetUsed.toLocaleString()} FCFA utilisés</span>
                                                <span>{project.budget.toLocaleString()} FCFA total</span>
                                            </div>
                                        </div>

                                        {/* Heures */}
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-gray-600 font-medium">Temps de travail</span>
                                                <span className="font-bold text-gray-900">
                                                    {project.actualHours}h / {project.estimatedHours}h
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min((project.actualHours / project.estimatedHours) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations projet */}
                                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Créateur</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {project.creator.firstName} {project.creator.lastName}
                                            </span>
                                        </div>

                                        {project.manager && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">Manager</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {project.manager.firstName} {project.manager.lastName}
                                                </span>
                                            </div>
                                        )}

                                        {project.clientName && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">Client</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{project.clientName}</span>
                                            </div>
                                        )}

                                        {project.deadline && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">Échéance</span>
                                                </div>
                                                <span className={`text-sm font-medium ${isNearDeadline ? 'text-orange-600' : 'text-gray-900'}`}>
                                                    {new Date(project.deadline).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Créé le</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Assignés */}
                                    {project.tasks.some(task => task.assignedUser) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-sm text-gray-600 font-medium mb-2">Consultants assignés</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(new Set(
                                                    project.tasks
                                                        .filter(task => task.assignedUser)
                                                        .map(task => `${task.assignedUser!.firstName} ${task.assignedUser!.lastName}`)
                                                )).map((name, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
                                                    >
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isDetailsModalOpen && (
                <ProjectDetailsModal
                    project={selectedProject}
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        // On réinitialise selectedProject après la fermeture pour être propre
                        setTimeout(() => setSelectedProject(null), 300);
                    }}
                />
            )}
            {/* Modal de création */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Créer un nouveau projet</h2>
                                <p className="text-sm text-gray-600 mt-1">Configurez les détails de votre projet</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject} className="p-6">
                            <div className="space-y-6">
                                {/* Informations générales */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                        Informations générales
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Titre du projet *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Développement site e-commerce"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description du projet *
                                            </label>
                                            <textarea
                                                required
                                                rows={4}
                                                placeholder="Décrivez les objectifs et le scope du projet..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Budget total (FCFA) *
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="1000"
                                                    placeholder="500000"
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={formData.budget}
                                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Heures estimées *
                                            </label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    placeholder="120"
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={formData.estimatedHours}
                                                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Date limite
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.deadline}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Priorité *
                                            </label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            >
                                                <option value="FAIBLE">🟢 Faible</option>
                                                <option value="MOYENNE">🔵 Moyenne</option>
                                                <option value="HAUTE">🟠 Haute</option>
                                                <option value="CRITIQUE">🔴 Critique</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Informations client */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                        Informations client
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom du client
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Nom de l'entreprise ou du client"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.clientName}
                                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email du client
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="client@example.com"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.clientEmail}
                                                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Gestion */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                        Gestion du projet
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Manager du projet
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            value={formData.managerId}
                                            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                        >
                                            <option value="">Sélectionner un manager</option>
                                            {consultants
                                                .filter(c => c.isAvailable)
                                                .map((consultant) => (
                                                    <option key={consultant.id} value={consultant.id}>
                                                        {consultant.user.firstName} {consultant.user.lastName} - {consultant.specialization} ({consultant.tjm.toLocaleString()} FCFA/jour)
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-4 pt-8 mt-8 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg hover:shadow-xl"
                                >
                                    {submitting ? 'Création...' : 'Créer le projet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal d'édition */}
            {showEditModal && selectedProject && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Modifier le projet</h2>
                                <p className="text-sm text-gray-600 mt-1">{selectedProject.title}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedProject(null);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProject} className="p-6">
                            <div className="space-y-6">
                                {/* Informations générales */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                        Informations générales
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Titre du projet *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description *
                                            </label>
                                            <textarea
                                                required
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Budget (FCFA) *
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="1000"
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={formData.budget}
                                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Budget utilisé: {selectedProject.budgetUsed.toLocaleString()} FCFA
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Heures estimées *
                                            </label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                    value={formData.estimatedHours}
                                                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Heures réelles: {selectedProject.actualHours}h
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Date limite
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.deadline}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Priorité *
                                            </label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            >
                                                <option value="FAIBLE">🟢 Faible</option>
                                                <option value="MOYENNE">🔵 Moyenne</option>
                                                <option value="HAUTE">🟠 Haute</option>
                                                <option value="CRITIQUE">🔴 Critique</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Informations client */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                        Informations client
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom du client
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Nom de l'entreprise"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.clientName}
                                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email du client
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="contact@client.com"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                value={formData.clientEmail}
                                                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Gestion */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                        Gestion du projet
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Manager du projet
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            value={formData.managerId}
                                            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                        >
                                            <option value="">Sélectionner un manager</option>
                                            {consultants
                                                .filter(c => c.isAvailable)
                                                .map((consultant) => (
                                                    <option key={consultant.id} value={consultant.id}>
                                                        {consultant.user.firstName} {consultant.user.lastName} - {consultant.specialization}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-4 pt-8 mt-8 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedProject(null);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg hover:shadow-xl"
                                >
                                    {submitting ? 'Mise à jour...' : 'Mettre à jour'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal d'assignation de consultant */}
            {showAssignModal && selectedProject && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Assigner un consultant</h2>
                                <p className="text-sm text-gray-600 mt-1">{selectedProject.title}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedProject(null);
                                    setAssignData({ consultantId: '', role: 'MANAGER' });
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignConsultant} className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sélectionner un consultant *
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        value={assignData.consultantId}
                                        onChange={(e) => setAssignData({ ...assignData, consultantId: e.target.value })}
                                    >
                                        <option value="">Choisir un consultant</option>
                                        {consultants
                                            .filter(c => c.isAvailable)
                                            .map((consultant) => (
                                                <option key={consultant.id} value={consultant.id}>
                                                    {consultant.user.firstName} {consultant.user.lastName} - {consultant.specialization} ({consultant.tjm.toLocaleString()} FCFA/jour)
                                                </option>
                                            ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Seuls les consultants disponibles sont affichés
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rôle dans le projet
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        value={assignData.role}
                                        onChange={(e) => setAssignData({ ...assignData, role: e.target.value })}
                                    >
                                        <option value="MANAGER">Manager du projet</option>
                                        <option value="CONTRIBUTOR">Contributeur</option>
                                    </select>
                                </div>

                                {/* Aperçu du consultant sélectionné */}
                                {assignData.consultantId && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Consultant sélectionné</h4>
                                        {(() => {
                                            const consultant = consultants.find(c => c.id === assignData.consultantId);
                                            return consultant ? (
                                                <div className="space-y-2">
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">{consultant.user.firstName} {consultant.user.lastName}</span>
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Spécialisation: {consultant.specialization}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        TJM: {consultant.tjm.toLocaleString()} FCFA
                                                    </p>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedProject(null);
                                        setAssignData({ consultantId: '', role: 'MANAGER' });
                                    }}
                                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
                                >
                                    {submitting ? 'Assignation...' : 'Assigner le consultant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Overlay pour fermer les dropdowns */}
            {dropdownOpen && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setDropdownOpen(null)}
                />
            )}
        </div>
    );
};

export default ProjectsPage;
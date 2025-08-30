// Fichier: app/taches/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import {
  Calendar, Clock, User, Search, Plus, MoreVertical, MessageCircle, FileText,
  CheckCircle2, Circle, Pause, Play, Upload, Download, Trash2, Edit3, Send,
  AlertCircle, DollarSign, Target, Timer, Users, BookOpen, X
} from 'lucide-react';
import { useToast } from "@/components/Toast";
import { TaskFormModal } from '@/components/tasks/TaskFormModal';

// --- Définition des Types ---
interface Task {
  id: string; title: string; description: string;
  status: 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'SUSPENDU';
  priority: 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
  estimatedHours: number; actualHours?: number; budget: number;
  deadline?: string; createdAt: string; startDate?: string; endDate?: string; projectId: string;
  assignedUser?: { id: string; firstName: string; lastName: string; avatar?: string; };
  project: { id: string; title: string; status: string; };
  comments: Comment[]; documents: Document[]; subTasks: Task[];
}
interface Project { id: string; title: string; }
interface Consultant { id: string; user: { id: string; firstName: string; lastName: string; }; }
interface Comment { id: string; content: string; createdAt: string; user: { id: string; firstName: string; lastName: string; avatar?: string; }; }
interface Document { id: string; name: string; url: string; size: number; type: string; createdAt: string; user: { id: string; firstName: string; lastName: string; }; }

// --- Composant Principal ---
export default function TaskManagementPage() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalState, setModalState] = useState<{ form?: boolean; details?: boolean; comments?: boolean; documents?: boolean; }>({});
  const [newComment, setNewComment] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const [currentUser] = useState({ id: 'user-1', firstName: 'Jean', lastName: 'Dupont' });

  const loadData = useCallback(async () => {
    if (!tasks?.length) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);

      const [tasksRes, projectsRes, consultantsRes] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`),
        fetch('/api/projects'),
        fetch('/api/consultants'),
      ]);

      if (!tasksRes.ok || !projectsRes.ok || !consultantsRes.ok) throw new Error('Erreur réseau');

      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();
      const consultantsData = await consultantsRes.json();
      setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
      setProjects(Array.isArray(projectsData.projects) ? projectsData.projects : []);
      setConsultants(Array.isArray(consultantsData.consultants) ? consultantsData.consultants : []);
    } catch (error) {
      addToast({ type: "error", title: "Erreur", message: "Impossible de charger les données." });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, priorityFilter, addToast, tasks?.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateTaskStatus = async (taskId: string, newStatus: string, actualHours?: number) => {
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any, actualHours: actualHours ?? t.actualHours } : t));
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, actualHours }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour");
      addToast({ type: "success", title: "Succès", message: "Statut de la tâche mis à jour." });
      await loadData();
    } catch (error) {
      setTasks(originalTasks);
      addToast({ type: "error", title: "Erreur", message: "Impossible de mettre à jour le statut." });
    }
  };

  const addComment = async (taskId: string, content: string) => {
    // ... Logique à connecter à l'API POST /api/tasks/[id]/comments
  };

  const openModal = (type: 'details' | 'comments' | 'documents' | 'form', task: Task | null = null) => {
    setSelectedTask(task);
    setModalState({ [type]: true });
  };

  const closeModal = () => {
    setModalState({});
    setSelectedTask(null);
  };

  const stats = {
    total: tasks?.length,
    aFaire: tasks.filter(t => t.status === 'A_FAIRE')?.length,
    enCours: tasks.filter(t => t.status === 'EN_COURS')?.length,
    terminees: tasks.filter(t => t.status === 'TERMINE')?.length,
  };

  if (loading) {
    return (
      <div title="Mes Tâches">
        <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>
      </div>
    );
  }

  return (
    <div title="Mes Tâches">
      <div className="p-6">
        <div className="flex items-center justify-between h-16 mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Mes Tâches</h1>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">{tasks?.length} tâches</span>
          </div>
          <button onClick={() => openModal('form')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" /><span>Nouvelle tâche</span>
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Rechercher une tâche..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="ALL">Tous les statuts</option><option value="A_FAIRE">À faire</option><option value="EN_COURS">En cours</option><option value="TERMINE">Terminé</option></select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="ALL">Toutes priorités</option><option value="CRITIQUE">Critique</option><option value="HAUTE">Haute</option><option value="MOYENNE">Moyenne</option><option value="FAIBLE">Faible</option></select>
          </div>
        </div>

        <div className="space-y-4">
          {tasks?.length > 0 ? tasks.map((task) => (
            <TaskCard key={task.id} task={task} onStatusUpdate={updateTaskStatus} onViewDetails={() => openModal('details', task)} onShowComments={() => openModal('comments', task)} onShowDocuments={() => openModal('documents', task)} onEdit={() => openModal('form', task)} />
          )) : (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center"><BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche trouvée</h3><p className="text-gray-500">Modifiez vos filtres ou créez votre première tâche.</p></div>
          )}
        </div>
      </div>

      <TaskFormModal isOpen={!!modalState.form} onClose={closeModal} onTaskSaved={loadData} taskToEdit={selectedTask} projects={projects} consultants={consultants} />
      {selectedTask && modalState.details && <TaskDetailsModal task={selectedTask} onClose={closeModal} onStatusUpdate={updateTaskStatus} />}
      {selectedTask && modalState.comments && <CommentsModal task={selectedTask} onClose={closeModal} onAddComment={addComment} newComment={newComment} setNewComment={setNewComment} />}
      {selectedTask && modalState.documents && <DocumentsModal task={selectedTask} onClose={closeModal} />}
    </div>
  );
};

// --- SOUS-COMPOSANTS ---

const TaskCard = ({ task, onStatusUpdate, onViewDetails, onShowComments, onShowDocuments, onEdit }: {
  task: Task; onStatusUpdate: (id: string, status: string, hours?: number) => void; onViewDetails: (task: Task) => void;
  onShowComments: () => void; onShowDocuments: () => void; onEdit: () => void;
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [timeInput, setTimeInput] = useState(task.actualHours?.toString() || '');

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'TERMINE' && !task.actualHours) { setShowTimeInput(true); } else { onStatusUpdate(task.id, newStatus, task.actualHours); }
    setShowActionsMenu(false);
  };
  const handleTimeSubmit = () => {
    const hours = parseFloat(timeInput);
    if (!isNaN(hours) && hours >= 0) { onStatusUpdate(task.id, 'TERMINE', hours); setShowTimeInput(false); }
  };
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'TERMINE';
  const getStatusColor = (s: string) => ({ A_FAIRE: 'text-gray-600 bg-gray-100', EN_COURS: 'text-blue-600 bg-blue-100', TERMINE: 'text-green-600 bg-green-100', SUSPENDU: 'text-yellow-600 bg-yellow-100' }[s] || 'text-gray-600 bg-gray-100');
  const getPriorityColor = (p: string) => ({ FAIBLE: 'text-green-600 bg-green-100', MOYENNE: 'text-yellow-600 bg-yellow-100', HAUTE: 'text-orange-600 bg-orange-100', CRITIQUE: 'text-red-600 bg-red-100' }[p] || 'text-gray-600 bg-gray-100');
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'N/A';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0"><div className="flex items-center flex-wrap gap-2 mb-2"><button onClick={() => onViewDetails(task)} className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left">{task.title}</button><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status.replace('_', ' ')}</span><span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>{isOverdue && <span className="flex items-center space-x-1 text-red-600 text-xs font-medium"><AlertCircle className="w-3 h-3" /><span>En retard</span></span>}</div><p className="text-gray-600 mb-3 text-sm">{task.description}</p><div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500"><div className="flex items-center space-x-1"><BookOpen className="w-4 h-4" /><span>{task.project.title}</span></div><div className="flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{task.actualHours || 0}h / {task.estimatedHours}h</span></div><div className="flex items-center space-x-1"><Calendar className="w-4 h-4" /><span>{formatDate(task.deadline)}</span></div></div></div>
        <div className="flex items-center space-x-2"><button onClick={onShowComments} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative"><MessageCircle className="w-5 h-5" />{task.comments?.length > 0 && <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{task.comments?.length}</span>}</button><button onClick={onShowDocuments} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative"><FileText className="w-5 h-5" />{task.documents?.length > 0 && <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{task.documents?.length}</span>}</button>
          <div className="relative"><button onClick={() => setShowActionsMenu(p => !p)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-5 h-5" /></button>
            {showActionsMenu && <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"><button onClick={() => { onEdit(); setShowActionsMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"><Edit3 className="w-4 h-4" /><span>Modifier</span></button>{task.status !== 'EN_COURS' && <button onClick={() => handleStatusChange('EN_COURS')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"><Play className="w-4 h-4" /><span>Commencer</span></button>}{task.status === 'EN_COURS' && <button onClick={() => handleStatusChange('A_FAIRE')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"><Pause className="w-4 h-4" /><span>Mettre en pause</span></button>}{task.status !== 'TERMINE' && <button onClick={() => handleStatusChange('TERMINE')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"><CheckCircle2 className="w-4 h-4" /><span>Marquer terminé</span></button>}<button onClick={() => { /* Logique de suppression */ }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"><Trash2 className="w-4 h-4" /><span>Supprimer</span></button></div>}
          </div>
        </div>
      </div>
      {showTimeInput && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-xl p-6 w-96"><h3 className="text-lg font-semibold mb-4">Temps passé sur la tâche</h3><div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Heures travaillées</label><input type="number" step="0.5" min="0.5" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus /><p className="text-sm text-gray-500 mt-1">Temps estimé: {task.estimatedHours}h</p></div><div className="flex space-x-3"><button onClick={handleTimeSubmit} disabled={!timeInput || parseFloat(timeInput) <= 0} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50">Terminer la tâche</button><button onClick={() => setShowTimeInput(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200">Annuler</button></div></div></div>}
    </div>
  );
};

const TaskDetailsModal = ({ task, onClose, onStatusUpdate }: { task: Task; onClose: () => void; onStatusUpdate: (id: string, status: string, hours?: number) => void; }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [actualHours, setActualHours] = useState(task.actualHours?.toString() || '');
  const updateTime = () => { const h = parseFloat(actualHours); if (!isNaN(h) && h >= 0) { onStatusUpdate(task.id, task.status, h); setIsEditing(false); } };
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';

  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col"><div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10"><h2 className="text-xl font-semibold text-gray-900">Détails de la tâche</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div><div className="overflow-y-auto p-6"><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><div className="mb-6"><h3>{task.title}</h3><p>{task.description}</p></div></div><div className="space-y-6"><div><h4>Projet</h4><p>{task.project.title}</p></div>{task.assignedUser && <div><h4>Assigné à</h4><p>{task.assignedUser.firstName} {task.assignedUser.lastName}</p></div>}</div></div></div></div></div>;
};

const CommentsModal = ({ task, onClose, onAddComment, newComment, setNewComment }: { task: Task; onClose: () => void; onAddComment: (taskId: string, content: string) => void; newComment: string; setNewComment: (content: string) => void; }) => {
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (newComment.trim()) { onAddComment(task.id, newComment.trim()); } };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"><div className="border-b px-6 py-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Commentaires - {task.title}</h2><button onClick={onClose}><X /></button></div><div className="flex-1 overflow-y-auto p-6">{task.comments?.length === 0 ? <p>Aucun commentaire.</p> : task.comments.map(c => <div key={c.id}><p>{c.user.firstName}: {c.content}</p></div>)}</div><div className="border-t p-6"><form onSubmit={handleSubmit}><textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Ajouter un commentaire..." className="w-full border rounded p-2" /><button type="submit">Envoyer</button></form></div></div></div>;
};

const DocumentsModal = ({ task, onClose }: { task: Task; onClose: () => void; }) => {
  const [dragOver, setDragOver] = useState(false);
  const handleFileUpload = async (files: FileList | null) => {/* ... */ };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col"><div className="border-b px-6 py-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Documents - {task.title}</h2><button onClick={onClose}><X /></button></div><div className="flex-1 overflow-y-auto p-6"><div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? 'border-blue-500' : 'border-gray-300'}`}><Upload /><p>Glissez-déposez ou <label>parcourez<input type="file" multiple className="hidden" /></label></p></div><div>{task.documents.map(d => <div key={d.id}>{d.name}</div>)}</div></div></div></div>;
};
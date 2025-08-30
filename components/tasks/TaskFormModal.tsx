// Fichier: components/tasks/TaskFormModal.tsx

"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/Toast';

// Types (à importer depuis un fichier central idéalement)
interface Task { id: string; title: string; description: string; status: string; priority: string; projectId: string; deadline?: string; }
interface Project { id: string; title: string; }
interface Consultant { id: string; user: { id: string; firstName: string; lastName: string; }; }

// Server Actions (à créer)
async function createTask(data: any) {
  const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!response.ok) throw new Error("Erreur lors de la création");
  return response.json();
}
async function updateTask(taskId: string, data: any) {
  const response = await fetch(`/api/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!response.ok) throw new Error("Erreur lors de la mise à jour");
  return response.json();
}


interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved: () => void;
  taskToEdit?: Task | null;
  projects: Project[];
  consultants: Consultant[];
}

export function TaskFormModal({ isOpen, onClose, onTaskSaved, taskToEdit, projects, consultants }: TaskFormModalProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedUserId: '',
    priority: 'MOYENNE',
    deadline: undefined as Date | undefined,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description,
        projectId: taskToEdit.projectId,
        assignedUserId: (taskToEdit as any).assignedUser?.id || '',
        priority: taskToEdit.priority,
        deadline: taskToEdit.deadline ? new Date(taskToEdit.deadline) : undefined,
      });
    } else {
      // Reset form for creation
      setFormData({
        title: '', description: '', projectId: '', assignedUserId: '',
        priority: 'MOYENNE', deadline: undefined,
      });
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        deadline: formData.deadline ? formData.deadline.toISOString() : null,
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, dataToSend);
        addToast({ type: 'success', title: "Succès", message: "Tâche mise à jour." });
      } else {
        await createTask(dataToSend);
        addToast({ type: 'success', title: "Succès", message: "Tâche créée avec succès." });
      }
      onTaskSaved();
      onClose();
    } catch (error) {
      addToast({ type: "success", title: "Erreur", message: (error as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Modifier la tâche" : "Ajouter une tâche"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            name="title"
            placeholder="Titre de la tâche"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Textarea
            name="description"
            placeholder="Description de la tâche..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select name="projectId" required value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !formData.deadline && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deadline ? format(formData.deadline, "PPP") : <span>Choisir une échéance</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.deadline} onSelect={(date) => setFormData({ ...formData, deadline: date })} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Priorité</Label>
            <RadioGroup
              defaultValue="MOYENNE"
              className="flex space-x-4"
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <div className="flex items-center space-x-2"><RadioGroupItem value="FAIBLE" id="low" /><Label htmlFor="low" className="text-xs text-green-600">Faible</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="MOYENNE" id="medium" /><Label htmlFor="medium" className="text-xs text-yellow-600">Moyenne</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="HAUTE" id="high" /><Label htmlFor="high" className="text-xs text-red-600">Haute</Label></div>
            </RadioGroup>
          </div>
          <Select
            name="assignedUserId"
            value={formData.assignedUserId}
            onValue-change={(value) => setFormData({ ...formData, assignedUserId: value === 'unassigned' ? '' : value })}
          >
            <SelectTrigger><SelectValue placeholder="Assigner à un consultant" /></SelectTrigger>
            <SelectContent>
              {/* On peut maintenant avoir une option non sélectionnable */}
              <SelectItem value="unassigned">Non assigné</SelectItem>

              {consultants.length > 0 && (
                <Select.Group>
                  <Select.Label>Consultants</Select.Label>
                  {consultants.map(c => (
                    <SelectItem key={c.id} value={c.user.id}>
                      {c.user.firstName} {c.user.lastName}
                    </SelectItem>
                  ))}
                </Select.Group>
              )}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sauvegarde...' : taskToEdit ? 'Mettre à jour' : 'Créer la tâche'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
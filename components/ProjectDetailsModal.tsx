// Fichier: components/ProjectDetailsModal.tsx

"use client";

import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Calendar, Clock, Users, DollarSign, FileText, SquareCheckBig,
  MessageSquare, ChartNoAxesColumn, ExternalLink,
} from "lucide-react";
import Link from "next/link";

// On réutilise les types que vous avez déjà
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'SUSPENDU';
  priority: 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
  budget: number;
  budgetUsed: number;
  estimatedHours: number;
  actualHours: number;
  deadline: string | null;
  createdAt: string;
  clientName?: string;
  manager?: { firstName: string; lastName: string; };
  tasks: Array<{
    id: string;
    status: 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'SUSPENDU';
    assignedUser?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

// Fonctions utilitaires de mappage pour les couleurs
const statusColorMapping = {
  A_FAIRE: 'bg-gray-100 text-gray-800',
  EN_COURS: 'bg-blue-100 text-blue-800',
  TERMINE: 'bg-green-100 text-green-800',
  SUSPENDU: 'bg-yellow-100 text-yellow-800',
};

const priorityColorMapping = {
  FAIBLE: 'bg-gray-100 text-gray-800',
  MOYENNE: 'bg-blue-100 text-blue-800',
  HAUTE: 'bg-orange-100 text-orange-800',
  CRITIQUE: 'bg-red-100 text-red-800',
};

const priorityBarColorMapping = {
  A_FAIRE: 'bg-gray-500',
  EN_COURS: 'bg-blue-500',
  TERMINE: 'bg-green-500',
  SUSPENDU: 'bg-yellow-500',
};


interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailsModal({ project, isOpen, onClose }: ProjectDetailsModalProps) {
  if (!project) return null;

  const taskProgress = project.tasks.length > 0
    ? (project.tasks.filter(t => t.status === 'TERMINE').length / project.tasks.length) * 100
    : 0;

  const teamMembers = Array.from(new Set(
    project.tasks
      .filter(task => task.assignedUser)
      .map(task => JSON.stringify(task.assignedUser))
  )).map(str => JSON.parse(str));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* --- EN-TÊTE --- */}
        <div className="flex items-start space-x-4">
          <div className={`w-2 h-16 rounded-full ${priorityBarColorMapping[project.status]}`} />
          <div>
            <h2 className="tracking-tight text-2xl font-bold flex items-center">{project.title}</h2>
            <p className="text-sm text-muted-foreground">{project.description}</p>
            <div className="flex items-center mt-2 space-x-2">
              <Badge className={statusColorMapping[project.status]}>{project.status.replace('_', ' ')}</Badge>
              <Badge className={priorityColorMapping[project.priority]}>{project.priority}</Badge>
            </div>
          </div>
        </div>

        {/* --- CARTES DE STATS --- */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-50/50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">Progression</div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold">{Math.round(taskProgress)}%</div>
                <div className="text-xs text-gray-500">{project.tasks.filter(t=>t.status==='TERMINE').length}/{project.tasks.length} tâches</div>
              </div>
              <Progress value={taskProgress} className="h-2" />
            </CardContent>
          </Card>
          <Card className="bg-gray-50/50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">Budget</div>
              <div className="text-xl font-bold">{project.budget.toLocaleString('fr-FR')} FCFA</div>
              <div className="text-xs text-gray-500 mt-1">Client: {project.clientName || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50/50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">Équipe</div>
              <div className="flex -space-x-2 mb-2">
                {teamMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                    <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${member.firstName} ${member.lastName}`} />
                    <AvatarFallback>{member.firstName.charAt(0)}{member.lastName.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {teamMembers.length > 3 && (
                    <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>+{teamMembers.length - 3}</AvatarFallback>
                    </Avatar>
                )}
              </div>
              <div className="text-xs text-gray-500">{teamMembers.length} consultant(s)</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50/50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">Dates</div>
              <div className="flex items-center text-gray-700 text-sm mb-1">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>Créé le: {new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>Échéance: {project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR') : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- SYSTÈME D'ONGLETS --- */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="bg-gray-100 p-1 h-auto">
            <TabsTrigger value="overview"><FileText className="h-4 w-4 mr-2" />Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="tasks"><SquareCheckBig className="h-4 w-4 mr-2" />Tâches</TabsTrigger>
            <TabsTrigger value="team"><Users className="h-4 w-4 mr-2" />Équipe</TabsTrigger>
            <TabsTrigger value="analytics"><ChartNoAxesColumn className="h-4 w-4 mr-2" />Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="p-6 border rounded-lg bg-white">
              <h3 className="font-semibold mb-2">Description du projet</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </TabsContent>
          <TabsContent value="tasks" className="mt-4">
             <div className="p-6 border rounded-lg bg-white text-center">
              <p className="text-muted-foreground">La liste des tâches sera affichée ici.</p>
            </div>
          </TabsContent>
          <TabsContent value="team" className="mt-4">
             <div className="p-6 border rounded-lg bg-white text-center">
              <p className="text-muted-foreground">Les membres de l'équipe seront listés ici.</p>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <div className="p-6 border rounded-lg bg-white text-center">
              <p className="text-muted-foreground">Les graphiques d'analyse du projet seront affichés ici.</p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* --- PIED DE PAGE AVEC BOUTONS --- */}
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Link href={`/projets/${project.id}`} passHref>
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir la page du projet
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
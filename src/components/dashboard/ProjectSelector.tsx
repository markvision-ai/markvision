import { useState } from 'react';
import { ChevronDown, Plus, Check, FolderOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Project {
  id: string;
  name: string;
  owner_id?: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  currentProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  onCreateProject?: (name: string) => Promise<{ id: string; name: string } | null>;
}

export const ProjectSelector = ({
  projects,
  currentProjectId,
  onProjectChange,
  onCreateProject,
}: ProjectSelectorProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !onCreateProject) return;

    setIsCreating(true);
    try {
      const result = await onCreateProject(newProjectName.trim());
      if (result) {
        onProjectChange(result.id);
        setNewProjectName('');
        setIsCreateDialogOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="gap-2 min-w-[180px] max-w-[300px] justify-between bg-black/5 dark:bg-white/[0.05] border border-border/10 hover:bg-black/10 dark:hover:bg-white/[0.08] hover:border-primary/30 transition-all duration-300 rounded-xl px-4 py-2.5 h-auto text-sm font-medium group"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              <span className="truncate text-foreground/90 group-hover:text-foreground transition-colors">
                {currentProject?.name || 'Выберите проект'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-70 group-hover:text-primary transition-all" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px] bg-popover/95 backdrop-blur-lg border-border/10 shadow-2xl">
          {projects.length === 0 ? (
            <div className="px-2 py-4 text-center text-muted-foreground text-sm">
              Нет доступных проектов
            </div>
          ) : (
            projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onProjectChange(project.id)}
                className="cursor-pointer flex items-center justify-between gap-2 py-2.5 px-3"
              >
                <div className="flex items-center gap-2 truncate">
                  {project.id === currentProjectId ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  <span className="truncate">{project.name}</span>
                </div>
              </DropdownMenuItem>
            ))
          )}

          {onCreateProject && (
            <>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                onClick={() => setIsCreateDialogOpen(true)}
                className="cursor-pointer text-primary py-2.5 px-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать новый проект
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создать новый проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Название проекта</Label>
              <Input
                id="project-name"
                placeholder="Например: Моя клиника"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || isCreating}
            >
              {isCreating ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

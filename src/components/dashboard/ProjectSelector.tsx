import { useState } from 'react';
import { cn } from '@/lib/utils';
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
            className="gap-3 min-w-[220px] max-w-[340px] justify-between bg-[#020617]/40 backdrop-blur-3xl border border-white/5 hover:bg-[#020617]/60 hover:border-white/10 transition-all duration-500 rounded-[1.25rem] px-6 py-4 h-auto text-[10px] font-black uppercase tracking-[0.2em] group shadow-interstellar"
          >
            <div className="flex items-center gap-3 truncate">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse" />
              <span className="truncate text-white transition-colors">
                {currentProject?.name || 'ВЫБОР КОНФИГУРАЦИИ'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 shrink-0 text-white/20 group-hover:text-primary transition-all duration-500 group-hover:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px] bg-[#020617]/90 backdrop-blur-3xl border border-white/5 shadow-interstellar rounded-[1.5rem] p-2">
          {projects.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FolderOpen className="w-10 h-10 text-white/5 mx-auto mb-3" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Конфигурации отсутствуют</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onProjectChange(project.id)}
                  className="cursor-pointer flex items-center justify-between gap-3 py-3 px-4 rounded-xl hover:bg-white/5 focus:bg-white/10 transition-all group/item border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center gap-3 truncate">
                    {project.id === currentProjectId ? (
                      <div className="w-5 h-5 flex items-center justify-center bg-primary/20 rounded-md">
                        <Check className="w-3 h-3 text-primary shrink-0" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 border border-white/5 rounded-md group-hover/item:border-white/20 transition-colors" />
                    )}
                    <span className={cn(
                      "truncate text-sm font-medium transition-colors",
                      project.id === currentProjectId ? "text-white" : "text-white/40 group-hover/item:text-white/70"
                    )}>{project.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {onCreateProject && (
            <>
              <DropdownMenuSeparator className="bg-white/5 mx-2 my-2" />
              <DropdownMenuItem
                onClick={() => setIsCreateDialogOpen(true)}
                className="cursor-pointer py-3 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary transition-all hover:text-white border border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Новый Проект
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

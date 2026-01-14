import { TeamManagement } from '@/components/team/TeamManagement';

interface Project {
  id: string;
  name: string;
}

interface TeamTabProps {
  projects: Project[];
}

export const TeamTab = ({ projects }: TeamTabProps) => {
  return <TeamManagement projects={projects} />;
};

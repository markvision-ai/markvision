import { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Plug2, 
  BookOpen, 
  Users, 
  Shield, 
  HelpCircle,
  Building2,
  Upload,
  DollarSign,
  Loader2,
  Save,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  Activity
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { IntegrationsTab } from './tabs/IntegrationsTab';
import { KnowledgeBaseTab } from './tabs/KnowledgeBaseTab';
import { TeamTab } from './tabs/TeamTab';
import { SecurityTab } from './tabs/SecurityTab';
import { HelpTab } from './tabs/HelpTab';
import { TechnicalHealthTab } from './tabs/TechnicalHealthTab';

interface Project {
  id: string;
  name: string;
  owner_id: string;
}

interface AdminHubProps {
  projectId: string;
  projects: Project[];
}

export const AdminHub = ({ projectId, projects }: AdminHubProps) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [projectSettings, setProjectSettings] = useState({
    clinicName: '',
    logoUrl: '',
    currency: 'KZT'
  });

  const currentProject = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (currentProject) {
      setProjectSettings(prev => ({
        ...prev,
        clinicName: currentProject.name
      }));
    }
  }, [currentProject]);

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: projectSettings.clinicName })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Настройки сохранены');
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast.error('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Общие', icon: Settings },
    { id: 'integrations', label: 'Интеграции', icon: Plug2 },
    { id: 'knowledge', label: 'База знаний', icon: BookOpen },
    { id: 'team', label: 'Команда', icon: Users },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'health', label: 'Здоровье системы', icon: Activity },
    { id: 'help', label: 'Помощь', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Административный хаб</h1>
            <p className="text-muted-foreground">Управление настройками проекта</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-card border p-1.5 rounded-xl">
          {tabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-lg"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: General Settings */}
        <TabsContent value="general" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Информация о клинике
              </CardTitle>
              <CardDescription>
                Основные настройки вашего проекта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clinic Name */}
              <div className="space-y-2">
                <Label htmlFor="clinicName">Название клиники</Label>
                <Input
                  id="clinicName"
                  value={projectSettings.clinicName}
                  onChange={(e) => setProjectSettings(prev => ({ ...prev, clinicName: e.target.value }))}
                  placeholder="Моя клиника"
                  className="max-w-md"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Логотип</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-secondary/50">
                    {projectSettings.logoUrl ? (
                      <img 
                        src={projectSettings.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Загрузить логотип
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG до 2MB. Рекомендуемый размер: 200x200px</p>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <select
                    id="currency"
                    value={projectSettings.currency}
                    onChange={(e) => setProjectSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="KZT">₸ Тенге (KZT)</option>
                    <option value="RUB">₽ Рубль (RUB)</option>
                    <option value="USD">$ Доллар (USD)</option>
                    <option value="EUR">€ Евро (EUR)</option>
                  </select>
                  <Badge variant="secondary" className="shrink-0">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {projectSettings.currency}
                  </Badge>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button onClick={handleSaveGeneral} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Сохранить изменения
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Empty state hint */}
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Здесь будут ваши дополнительные настройки</p>
              <p className="text-xs mt-1">Часовой пояс, язык интерфейса и другое</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Integrations */}
        <TabsContent value="integrations" className="mt-0">
          <IntegrationsTab projectId={projectId} />
        </TabsContent>

        {/* Tab 3: Knowledge Base */}
        <TabsContent value="knowledge" className="mt-0">
          <KnowledgeBaseTab projectId={projectId} />
        </TabsContent>

        {/* Tab 4: Team */}
        <TabsContent value="team" className="mt-0">
          <TeamTab projects={projects} />
        </TabsContent>

        {/* Tab 5: Security */}
        <TabsContent value="security" className="mt-0">
          <SecurityTab projectId={projectId} />
        </TabsContent>

        {/* Tab 6: Technical Health */}
        <TabsContent value="health" className="mt-0">
          <TechnicalHealthTab projectId={projectId} />
        </TabsContent>

        {/* Tab 7: Help */}
        <TabsContent value="help" className="mt-0">
          <HelpTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

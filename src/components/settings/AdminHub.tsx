import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Settings as SettingsIcon,
  BookOpen,
  Shield,
  HelpCircle,
  Building2,
  Upload,
  DollarSign,
  Loader2,
  Save,
  AlertCircle,
  Activity,
  Users,
  Plug,
  Check,
  Globe,
  Bell,
  Clock,
  Trash2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TeamManagement } from '@/components/team/TeamManagement';
import IntegrationsManagementNew from '@/components/integrations/IntegrationsManagementNew';
import { KnowledgeBaseTab } from './tabs/KnowledgeBaseTab';
import { SecurityTab } from './tabs/SecurityTab';
import { HelpTab } from './tabs/HelpTab';
import { TechnicalHealthTab } from './tabs/TechnicalHealthTab';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  logo_url?: string | null;
  settings?: any;
}

interface AdminHubProps {
  projectId: string;
  projects: Project[];
}

export const AdminHub = ({ projectId, projects }: AdminHubProps) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        clinicName: currentProject.name,
        logoUrl: currentProject.logo_url || '',
        currency: currentProject.settings?.currency || 'KZT'
      }));
    }
  }, [currentProject]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимум 2МБ');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      setProjectSettings(prev => ({ ...prev, logoUrl: publicUrl }));
      toast.success('Логотип загружен');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Ошибка загрузки логотиps: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: projectSettings.clinicName,
          logo_url: projectSettings.logoUrl,
          settings: {
            ...currentProject?.settings,
            currency: projectSettings.currency
          }
        })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Настройки сохранены');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка сохранения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Общие', icon: Globe },
    { id: 'team', label: 'Сотрудники', icon: Users },
    { id: 'integrations', label: 'Подключения', icon: Plug },
    { id: 'knowledge', label: 'База знаний', icon: BookOpen },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'health', label: 'Здоровье системы', icon: Activity },
    { id: 'help', label: 'Помощь', icon: HelpCircle },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-primary/20 ring-1 ring-white/20">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Административный хаб
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Полное управление проектом {currentProject?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white/5 border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
              Project ID: {projectId.slice(0, 8)}...
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl no-scrollbar">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "gap-2 px-5 py-3 rounded-xl transition-all duration-300",
                "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-2xl shadow-blue-900/5 data-[state=active]:shadow-primary/20",
                "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Tab 1: General Settings */}
            <TabsContent value="general" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-0">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl space-y-8">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <Building2 className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Основная информация</h3>
                      <p className="text-sm text-muted-foreground">Настройте визуальную идентификацию вашего бренда</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Clinic Name */}
                    <div className="space-y-3">
                      <Label htmlFor="clinicName" className="text-slate-600 text-sm">Название клиники / Проекта</Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          id="clinicName"
                          value={projectSettings.clinicName}
                          onChange={(e) => setProjectSettings(prev => ({ ...prev, clinicName: e.target.value }))}
                          placeholder="Название вашей компании"
                          className="pl-10 h-12 bg-white/5 border-slate-200 text-white rounded-xl focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="space-y-3">
                      <Label htmlFor="currency" className="text-slate-600 text-sm">Валюта проекта</Label>
                      <div className="flex items-center gap-3">
                        <select
                          id="currency"
                          value={projectSettings.currency}
                          onChange={(e) => setProjectSettings(prev => ({ ...prev, currency: e.target.value }))}
                          className="flex h-12 w-full rounded-xl border border-slate-200 bg-white/5 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                        >
                          <option value="KZT">₸ Тенге (KZT)</option>
                          <option value="RUB">₽ Рубль (RUB)</option>
                          <option value="USD">$ Доллар (USD)</option>
                          <option value="EUR">€ Евро (EUR)</option>
                        </select>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-4 pt-4">
                    <Label className="text-slate-600 text-sm">Логотип бренда</Label>
                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-2xl bg-white/5 border border-dashed border-slate-200">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-black/50 border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xl">
                          {projectSettings.logoUrl ? (
                            <img
                              src={projectSettings.logoUrl}
                              alt="Branding Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Building2 className="w-10 h-10 text-white/10" />
                          )}
                        </div>
                        {projectSettings.logoUrl && (
                          <button
                            onClick={() => setProjectSettings(prev => ({ ...prev, logoUrl: '' }))}
                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl shadow-blue-900/5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <div>
                          <p className="text-sm font-medium text-white">Логотип вашей компании</p>
                          <p className="text-xs text-muted-foreground mt-1">Рекомендуем квадратное изображение PNG/WEBP. Макс 2МБ.</p>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoUpload}
                          className="hidden"
                          accept="image/*"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="secondary"
                          disabled={uploading}
                          className="bg-white/10 hover:bg-white/20 border-slate-200 h-10 px-6 rounded-xl transition-all"
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                          {projectSettings.logoUrl ? 'Сменить логотип' : 'Загрузить логотип'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-8 border-t border-white/5 flex justify-end">
                    <Button
                      onClick={handleSaveGeneral}
                      disabled={loading}
                      className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-blue-900/5 shadow-primary/20 gap-2 min-w-[200px]"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Сохранить изменения
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-6 rounded-3xl flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Уведомления</p>
                      <p className="text-xs text-muted-foreground">Настройте оповещения</p>
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-6 rounded-3xl flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Логи изменений</p>
                      <p className="text-xs text-muted-foreground">История всех правок</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl bg-primary/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-colors" />
                  <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Безопасность</h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        Двухфакторная аутентификация и управление правами для защиты вашего проекта.
                      </p>
                    </div>
                    <Button variant="link" className="text-primary p-0 h-auto hover:underline font-semibold" onClick={() => setActiveTab('security')}>
                      Настроить сейчас
                    </Button>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-6 rounded-3xl text-center space-y-4">
                  <AlertCircle className="w-10 h-10 mx-auto text-white/10" />
                  <div>
                    <p className="text-sm text-slate-500">Скоро здесь появится</p>
                    <p className="text-xs text-muted-foreground mt-1">Локализация интерфейса, выбор темы и управление подпиской.</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Team Management */}
            <TabsContent value="team" className="mt-0">
              <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl min-h-[600px]">
                <TeamManagement projects={projects} />
              </div>
            </TabsContent>

            {/* Tab 3: Integrations */}
            <TabsContent value="integrations" className="mt-0">
              <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl min-h-[600px]">
                <IntegrationsManagementNew projectId={projectId} />
              </div>
            </TabsContent>

            {/* Tab 4: Knowledge Base */}
            <TabsContent value="knowledge" className="mt-0">
              <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl min-h-[600px]">
                <KnowledgeBaseTab projectId={projectId} />
              </div>
            </TabsContent>

            {/* Tab 5: Security */}
            <TabsContent value="security" className="mt-0">
              <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl min-h-[600px]">
                <SecurityTab projectId={projectId} />
              </div>
            </TabsContent>

            {/* Tab 6: Technical Health */}
            <TabsContent value="health" className="mt-0">
              <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl min-h-[600px]">
                <TechnicalHealthTab projectId={projectId} />
              </div>
            </TabsContent>

            {/* Tab 7: Help */}
            <TabsContent value="help" className="mt-0">
              <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl min-h-[600px]">
                <HelpTab projectId={projectId} />
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};


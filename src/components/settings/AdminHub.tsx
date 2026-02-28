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
      <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-8 rounded-[32px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48 group-hover:bg-blue-500/20 transition-colors duration-1000" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-500">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight uppercase">
                Административный хаб
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1 text-[10px] uppercase font-black tracking-widest opacity-60">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Управление проектом {currentProject?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white/5 border-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground shadow-inner">
              Project ID: {projectId.slice(0, 8)}...
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1.5 bg-[#020617]/40 backdrop-blur-3xl border border-white/10 rounded-[24px] no-scrollbar">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "gap-3 px-6 py-3.5 rounded-[18px] transition-all duration-300 font-black uppercase tracking-widest text-[10px]",
                "data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-interstellar data-[state=active]:border border-white/5",
                "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
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
                <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-8 rounded-[32px] space-y-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:to-blue-500/5 transition-all duration-1000" />
                  <div className="flex items-center gap-5 border-b border-white/5 pb-8 relative z-10">
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Основная информация</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1">Визуальная идентификация вашего бренда</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Clinic Name */}
                    <div className="space-y-3 relative z-10">
                      <Label htmlFor="clinicName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">Название клиники / Проекта</Label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Building2 className="w-4 h-4 text-muted-foreground group-focus-within/input:text-blue-400 transition-colors" />
                        </div>
                        <Input
                          id="clinicName"
                          value={projectSettings.clinicName}
                          onChange={(e) => setProjectSettings(prev => ({ ...prev, clinicName: e.target.value }))}
                          placeholder="Название вашей компании"
                          className="pl-11 h-14 bg-white/5 border-white/10 text-foreground rounded-2xl focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-black uppercase tracking-widest text-[10px]"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="space-y-3 relative z-10">
                      <Label htmlFor="currency" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">Валюта проекта</Label>
                      <div className="flex items-center gap-3">
                        <select
                          id="currency"
                          value={projectSettings.currency}
                          onChange={(e) => setProjectSettings(prev => ({ ...prev, currency: e.target.value }))}
                          className="flex h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground focus:ring-2 focus:ring-blue-500/40 outline-none appearance-none transition-all cursor-pointer"
                        >
                          <option value="KZT" className="bg-[#020617]">₸ Тенге (KZT)</option>
                          <option value="RUB" className="bg-[#020617]">₽ Рубль (RUB)</option>
                          <option value="USD" className="bg-[#020617]">$ Доллар (USD)</option>
                          <option value="EUR" className="bg-[#020617]">€ Евро (EUR)</option>
                        </select>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
                          <DollarSign className="w-5 h-5 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 relative z-10">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">Логотип бренда</Label>
                    <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-[#020617]/40 border border-white/5 shadow-inner">
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
                          <p className="text-sm font-black text-foreground uppercase tracking-tight">Логотип вашей компании</p>
                          <p className="text-[10px] font-medium text-muted-foreground mt-1 opacity-60">Рекомендуем квадратное изображение PNG/WEBP. Макс 2МБ.</p>
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
                          variant="ghost"
                          disabled={uploading}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 h-12 px-8 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]"
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Upload className="w-4 h-4 mr-3" />}
                          {projectSettings.logoUrl ? 'Сменить логотип' : 'Загрузить логотип'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-8 border-t border-white/5 flex justify-end relative z-10">
                    <Button
                      onClick={handleSaveGeneral}
                      disabled={loading}
                      className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] gap-3 min-w-[240px]"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Сохранить изменения
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                  <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-6 rounded-[24px] flex items-center gap-5 hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground uppercase tracking-tight">Уведомления</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Настройте оповещения</p>
                    </div>
                  </div>
                  <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-6 rounded-[24px] flex items-center gap-5 hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground uppercase tracking-tight">Логи изменений</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">История всех правок</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-8 rounded-[32px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                  <div className="relative z-10 space-y-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-600/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                      <Shield className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-foreground text-xl uppercase tracking-tight">Безопасность</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-2 leading-relaxed">
                        Двухфакторная аутентификация и управление правами для защиты вашего проекта.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300 p-0 h-auto font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group/btn"
                      onClick={() => setActiveTab('security')}
                    >
                      Настроить сейчас
                      <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-8 rounded-[32px] text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-white/10" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">Скоро здесь появится</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mt-2 leading-relaxed">
                      Локализация интерфейса, выбор темы и управление подпиской.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Team Management */}
            <TabsContent value="team" className="mt-0">
              <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-0 rounded-[32px] min-h-[600px] overflow-hidden">
                <TeamManagement projects={projects} />
              </div>
            </TabsContent>

            {/* Tab 3: Integrations */}
            <TabsContent value="integrations" className="mt-0">
              <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-0 rounded-[32px] min-h-[600px] overflow-hidden">
                <IntegrationsManagementNew projectId={projectId} />
              </div>
            </TabsContent>

            {/* Tab 4: Knowledge Base */}
            <TabsContent value="knowledge" className="mt-0">
              <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-8 rounded-[32px] min-h-[600px]">
                <KnowledgeBaseTab projectId={projectId} />
              </div>
            </TabsContent>

            {/* Tab 5: Security */}
            <TabsContent value="security" className="mt-0">
              <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-8 rounded-[32px] min-h-[600px]">
                <SecurityTab projectId={projectId} />
              </div>
            </TabsContent>

            {/* Tab 6: Technical Health */}
            <TabsContent value="health" className="mt-0">
              <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-8 rounded-[32px] min-h-[600px]">
                <TechnicalHealthTab projectId={projectId} />
              </div>
            </TabsContent>

            {/* Tab 7: Help */}
            <TabsContent value="help" className="mt-0">
              <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-8 rounded-[32px] min-h-[600px]">
                <HelpTab projectId={projectId} />
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};


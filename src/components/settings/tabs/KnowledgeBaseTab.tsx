import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Brain,
  Upload,
  Folder,
  Sparkles,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Terminal,
  MessageSquare,
  Zap,
  Clock,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Document {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  is_ai_trained: boolean | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string | null;
}

interface KnowledgeBaseTabProps {
  projectId: string;
}

const categories = [
  { id: 'all', label: 'Все', icon: Folder, color: 'text-white/40' },
  { id: 'scripts', label: 'Скрипты продаж', icon: MessageSquare, color: 'text-blue-500' },
  { id: 'prompts', label: 'Промты для ИИ', icon: Terminal, color: 'text-amber-500' },
  { id: 'instructions', label: 'Инструкции', icon: Zap, color: 'text-purple-500' },
  { id: 'faq', label: 'База ответов (FAQ)', icon: BookOpen, color: 'text-blue-500' },
];

export const KnowledgeBaseTab = ({ projectId }: KnowledgeBaseTabProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    content: '',
    category: 'scripts',
    tags: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    try {
      const { error } = await supabase.from('knowledge_base').insert([{
        project_id: projectId,
        title: newDoc.title,
        content: newDoc.content,
        category: newDoc.category,
        tags: newDoc.tags.split(',').map(t => t.trim()).filter(Boolean),
      }]);

      if (error) throw error;

      toast.success('Документ добавлен');
      setIsAddDialogOpen(false);
      setNewDoc({ title: '', content: '', category: 'scripts', tags: '' });
      fetchDocuments();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error adding document:', error);
      toast.error('Ошибка при добавлении документа');
    }
  };

  const handleTrainAI = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ is_ai_trained: true })
        .eq('id', docId);

      if (error) throw error;

      toast.success('ИИ обучен на этом документе');
      fetchDocuments();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error training AI:', error);
      toast.error('Ошибка при обучении ИИ');
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      toast.success('Документ удален');
      fetchDocuments();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting document:', error);
      toast.error('Ошибка при удалении документа');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const trainedCount = documents.filter(d => d.is_ai_trained).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-primary/20 ring-1 ring-white/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              База знаний
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Документы для обучения ИИ и команды
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-12 bg-white/5 border-white/10 text-white rounded-xl hover:bg-white/10 px-6 gap-2"
          >
            <Upload className="w-4 h-4" />
            Загрузить
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-2xl shadow-blue-900/5 shadow-primary/20 px-8 gap-2 font-bold tracking-tight"
          >
            <Plus className="w-5 h-5" />
            Создать
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="interstellar-glass border border-white/5 p-6 rounded-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform duration-500">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/40 uppercase tracking-widest">Всего документов</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tighter">{documents.length}</span>
                <span className="text-xs text-white/20 font-medium">файлов</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="interstellar-glass border border-white/5 p-6 rounded-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform duration-500">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/40 uppercase tracking-widest">Обучено ИИ</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tighter">{trainedCount}</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tight">Active</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="interstellar-glass border border-white/5 p-6 rounded-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/40 uppercase tracking-widest">Категорий</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tighter">{new Set(documents.map(d => d.category)).size || 0}</span>
                <span className="text-xs text-white/20 font-medium">типов</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            placeholder="Поиск по названию или содержанию документов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-black/40 border-white/5 text-white rounded-2xl focus:ring-primary/50 placeholder:text-white/20 transition-all backdrop-blur-xl"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full lg:w-auto p-1 bg-white/5 rounded-2xl border border-white/5">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap",
                selectedCategory === cat.id
                  ? "bg-primary text-white shadow-2xl shadow-blue-900/5 shadow-primary/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <cat.icon className={cn("w-4 h-4", selectedCategory === cat.id ? "text-white" : cat.color)} />
              <span className="text-xs font-bold uppercase tracking-tight">{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDocuments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full"
            >
              <div className="interstellar-glass border border-white/5 border-dashed rounded-3xl py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Документы не найдены</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Здесь будут ваши скрипты, промты и важные инструкции.
                </p>
              </div>
            </motion.div>
          ) : (
            filteredDocuments.map((doc, index) => {
              const category = categories.find(c => c.id === doc.category) || categories[0];
              const Icon = category.icon;

              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl blur-xl" />

                  <div className="interstellar-glass border border-white/5 p-6 rounded-3xl relative h-full flex flex-col group-hover:border-primary/30 transition-all duration-500 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-colors" />

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className={cn(
                        "p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500",
                        category.color
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.is_ai_trained && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] text-blue-500 font-bold uppercase">AI Trained</span>
                          </div>
                        )}
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white/40 group-hover:text-white/60 text-[10px] uppercase font-bold tracking-tight">
                          {category.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 flex-1 relative z-10">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                        {doc.title}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </h3>
                      <p className="text-sm text-white/40 line-clamp-3 leading-relaxed">
                        {doc.content || "Нет содержимого"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-6 relative z-10">
                      {doc.tags?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/60">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2 text-[10px] text-white/20 font-medium">
                        <Clock className="w-3 h-3" />
                        {doc.created_at ? format(new Date(doc.created_at), 'd MMMM yyyy', { locale: ru }) : 'Недавно'}
                      </div>

                      <div className="flex items-center gap-1">
                        {!doc.is_ai_trained && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTrainAI(doc.id)}
                            className="w-8 h-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                            title="Обучить ИИ"
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Add Document Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl bg-black/60 backdrop-blur-3xl border-white/5 p-0 overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none -mr-32 -mt-32" />

          <DialogHeader className="p-8 pb-0 relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white tracking-tight">Создать документ</DialogTitle>
                <DialogDescription className="text-white/40 mt-1">
                  Добавьте новый скрипт, промт или инструкцию в базу знаний проекта.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">Название документа</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="Напр: Скрипт закрытия возражений"
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">Категория</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                  </div>
                  <select
                    className="flex h-12 w-full pl-10 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none transition-all"
                    value={newDoc.category}
                    onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-[#1A1A1A] text-white">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">Содержимое</Label>
              <Textarea
                value={newDoc.content}
                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                placeholder="Вставьте текст скрипта или промта здесь..."
                className="min-h-[200px] bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary/50 p-4 leading-relaxed resize-none"
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">Теги (через запятую)</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Sparkles className="w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  value={newDoc.tags}
                  onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                  placeholder="продажи, холодные, скрипт"
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-4 bg-white/5 border-t border-white/5 gap-3 relative z-10">
            <Button
              variant="ghost"
              onClick={() => setIsAddDialogOpen(false)}
              className="h-12 px-6 rounded-xl text-white/40 hover:text-white hover:bg-white/5 font-medium"
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddDocument}
              disabled={!newDoc.title || !newDoc.content}
              className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-blue-900/5 shadow-primary/20 font-bold gap-2"
            >
              <Check className="w-5 h-5" />
              Создать документ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

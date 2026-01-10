import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  BookOpen, 
  Plus, 
  Search, 
  FileText,
  Brain,
  Upload,
  Folder,
  Sparkles,
  Download,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_ai_trained: boolean;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface KnowledgeBaseProps {
  projectId: string;
}

const categories = [
  { id: 'all', label: 'Все', icon: Folder },
  { id: 'scripts', label: 'Скрипты', icon: FileText },
  { id: 'products', label: 'Продукты', icon: BookOpen },
  { id: 'faq', label: 'FAQ', icon: BookOpen },
  { id: 'training', label: 'Обучение', icon: Brain },
];

export const KnowledgeBase = ({ projectId }: KnowledgeBaseProps) => {
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
      console.error('Error fetching documents:', error);
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
      console.error('Error adding document:', error);
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
      console.error('Error training AI:', error);
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
      console.error('Error deleting document:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            База знаний
          </h2>
          <p className="text-muted-foreground">Документы для обучения ИИ и команды</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Загрузить
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Создать документ
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего документов</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Brain className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Обучено ИИ</p>
                <p className="text-2xl font-bold">{trainedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Категорий</p>
                <p className="text-2xl font-bold">{new Set(documents.map(d => d.category)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск документов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <cat.icon className="w-4 h-4 mr-2" />
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Загрузка...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Документы не найдены</p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                  </div>
                  {doc.is_ai_trained && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <Brain className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {doc.content?.substring(0, 100)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  <Badge variant="outline">{doc.category}</Badge>
                  {doc.tags?.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  {!doc.is_ai_trained && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTrainAI(doc.id)}
                    >
                      <Brain className="w-3 h-3 mr-1" />
                      Обучить ИИ
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Document Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать документ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                placeholder="Скрипт продаж v2"
              />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newDoc.category}
                onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
              >
                <option value="scripts">Скрипты</option>
                <option value="products">Продукты</option>
                <option value="faq">FAQ</option>
                <option value="training">Обучение</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Содержимое</Label>
              <Textarea
                value={newDoc.content}
                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                placeholder="Содержимое документа..."
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Теги (через запятую)</Label>
              <Input
                value={newDoc.tags}
                onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                placeholder="продажи, скрипт, холодные звонки"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddDocument} disabled={!newDoc.title || !newDoc.content}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

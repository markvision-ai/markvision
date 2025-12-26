import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AddLeadDialogProps {
  projectId: string;
  onLeadAdded: () => void;
}

const sourceOptions = [
  { id: 'manual', label: 'Ручной ввод' },
  { id: 'phone', label: 'Звонок' },
  { id: 'website', label: 'Сайт' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'vk', label: 'VK' },
  { id: 'referral', label: 'Рекомендация' },
  { id: 'other', label: 'Другое' },
];

export function AddLeadDialog({ projectId, onLeadAdded }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'manual',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() && !formData.phone.trim()) {
      toast.error('Укажите имя или телефон');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          project_id: projectId,
          name: formData.name.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          utm_source: formData.source,
          utm_medium: 'manual',
          status: 'new',
        });

      if (error) throw error;

      toast.success('Лид успешно добавлен');
      setFormData({ name: '', phone: '', email: '', source: 'manual' });
      setOpen(false);
      onLeadAdded();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Ошибка при добавлении лида');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "gap-2 h-12 px-5 rounded-xl font-semibold",
            "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]",
            "text-primary-foreground shadow-lg shadow-primary/25",
            "hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]",
            "active:scale-[0.98] transition-all duration-300",
            "animate-gradient-shift"
          )}
        >
          <UserPlus className="w-5 h-5" />
          <span className="hidden sm:inline">Добавить лид</span>
          <span className="sm:hidden">Добавить</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md crm-card-glass border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
              Новый лид
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <Label htmlFor="name" className="text-sm font-semibold text-foreground/80">
              Имя клиента
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Введите имя..."
              className="h-11 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <Label htmlFor="phone" className="text-sm font-semibold text-foreground/80">
              Телефон
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+7 (999) 123-45-67"
              className="h-11 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">
              Email <span className="text-muted-foreground font-normal">(опционально)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
              className="h-11 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <Label htmlFor="source" className="text-sm font-semibold text-foreground/80">
              Источник
            </Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Выберите источник" />
              </SelectTrigger>
              <SelectContent className="crm-card-glass border-border/50">
                {sourceOptions.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 pt-2"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-11 rounded-xl border-border/50 hover:bg-muted"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-1 h-11 rounded-xl font-semibold",
                "bg-gradient-to-r from-primary to-accent",
                "text-primary-foreground shadow-lg",
                "hover:shadow-xl hover:scale-[1.02]",
                "active:scale-[0.98] transition-all"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Добавить
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

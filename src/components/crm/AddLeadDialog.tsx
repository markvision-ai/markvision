import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2, Sparkles, UserCheck, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useStaffForAssignment } from '@/hooks/useStaffAssignment';
import { Switch } from '@/components/ui/switch';

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

// Phone validation for +7 format
const formatPhone = (value: string): string => {
  // Remove all non-digit characters except +
  let digits = value.replace(/[^\d+]/g, '');
  
  // If starts with 8, replace with +7
  if (digits.startsWith('8') && digits.length > 1) {
    digits = '+7' + digits.slice(1);
  }
  
  // If starts with 7 (without +), add +
  if (digits.startsWith('7') && !digits.startsWith('+')) {
    digits = '+' + digits;
  }
  
  // If doesn't start with +7 but has digits, assume Russian number
  if (digits && !digits.startsWith('+')) {
    digits = '+7' + digits;
  }
  
  // Format: +7 (XXX) XXX-XX-XX
  if (digits.startsWith('+7')) {
    const numbers = digits.slice(2);
    let formatted = '+7';
    if (numbers.length > 0) formatted += ' (' + numbers.slice(0, 3);
    if (numbers.length >= 3) formatted += ') ';
    if (numbers.length > 3) formatted += numbers.slice(3, 6);
    if (numbers.length > 6) formatted += '-' + numbers.slice(6, 8);
    if (numbers.length > 8) formatted += '-' + numbers.slice(8, 10);
    return formatted;
  }
  
  return digits;
};

const validatePhone = (phone: string): boolean => {
  if (!phone.trim()) return true; // Empty is valid (optional)
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length === 11 && digits.startsWith('7');
};

export function AddLeadDialog({ projectId, onLeadAdded }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const { getRandomOnlineStaff, getOnlineStaff } = useStaffForAssignment(projectId);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    source: 'manual',
  });

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    if (formatted && !validatePhone(formatted)) {
      setPhoneError('Формат: +7 (XXX) XXX-XX-XX');
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() && !formData.phone.trim()) {
      toast.error('Укажите имя или телефон');
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error('Неверный формат телефона');
      return;
    }

    setLoading(true);
    try {
      // Check if we should auto-assign to a staff member
      let assignedTo: string | null = null;
      if (autoAssign) {
        const randomStaff = getRandomOnlineStaff();
        if (randomStaff) {
          assignedTo = randomStaff.id;
        }
      }

      const { error } = await supabase
        .from('leads')
        .insert({
          project_id: projectId,
          name: formData.name.trim() || null,
          phone: formData.phone.trim() || null,
          utm_source: formData.source,
          utm_medium: 'manual',
          status: 'Новая',
          assigned_to: assignedTo,
          assigned_at: assignedTo ? new Date().toISOString() : null,
        });

      if (error) throw error;

      const onlineCount = getOnlineStaff().length;
      if (assignedTo) {
        toast.success('Лид добавлен и назначен дежурному менеджеру');
      } else if (autoAssign && onlineCount === 0) {
        toast.success('Лид добавлен (нет онлайн менеджеров для назначения)');
      } else {
        toast.success('Лид успешно добавлен');
      }

      toast.success('Лид успешно добавлен');
      setFormData({ name: '', phone: '', source: 'manual' });
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
            <div className="space-y-1">
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className={cn(
                  "h-11 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
                  phoneError && "border-destructive focus:border-destructive focus:ring-destructive/20"
                )}
              />
              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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

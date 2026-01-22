import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Loader2, Sparkles, Users, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViralLoopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    name?: string | null;
    phone?: string | null;
  };
  projectId: string;
  onSuccess?: () => void;
}

interface FriendData {
  name: string;
  phone: string;
}

export const ViralLoopDialog = ({
  open,
  onOpenChange,
  lead,
  projectId,
  onSuccess
}: ViralLoopDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<FriendData[]>([
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' }
  ]);

  const handleFriendChange = (index: number, field: 'name' | 'phone', value: string) => {
    const updated = [...friends];
    updated[index][field] = value;
    setFriends(updated);
  };

  const validateFriends = () => {
    const validFriends = friends.filter(f => f.name.trim() && f.phone.trim());
    if (validFriends.length === 0) {
      toast.error('Заполните хотя бы одно поле');
      return false;
    }
    return validFriends;
  };

  const handleSubmit = async () => {
    const validFriends = validateFriends();
    if (!validFriends) return;

    setLoading(true);

    try {
      // Сохраняем рефералов в базу
      const referrals = validFriends.map(friend => ({
        project_id: projectId,
        referrer_lead_id: lead.id,
        referee_name: friend.name.trim(),
        referee_phone: friend.phone.trim(),
        certificate_value: 10000,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('referrals')
        .insert(referrals);

      if (error) throw error;

      toast.success('Сертификаты подготовлены к отправке! 🎉', {
        description: `${validFriends.length} сертификат${validFriends.length === 1 ? '' : validFriends.length < 5 ? 'а' : 'ов'} будет отправлен${validFriends.length === 1 ? '' : 'о'} в ближайшее время`
      });

      // TODO: Вызов Webhook в n8n для отправки сообщений
      // await fetch('/api/n8n/send-referral-certificates', {
      //   method: 'POST',
      //   body: JSON.stringify({ referrals: validFriends, referrerName: lead.name })
      // });

      onSuccess?.();
      onOpenChange(false);
      
      // Очистка формы
      setFriends([
        { name: '', phone: '' },
        { name: '', phone: '' },
        { name: '', phone: '' }
      ]);
    } catch (error) {
      console.error('Error creating referrals:', error);
      toast.error('Ошибка при создании сертификатов');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <Gift className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <DialogTitle className="text-2xl">
                Подарок от имени {lead.name || 'пациента'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Виральная петля • Сертификаты для друзей
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground font-medium mb-1">
                Мы отправим этим людям именной сертификат на 10 000 ₸ от вашего имени
              </p>
              <p className="text-muted-foreground text-xs">
                Каждый друг получит персональное WhatsApp сообщение с красивым сертификатом
              </p>
            </div>
          </div>
        </motion.div>

        {/* Friend Input Fields */}
        <div className="space-y-4 mt-4">
          {friends.map((friend, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={cn(
                "relative overflow-hidden rounded-xl p-4 border transition-all",
                "bg-card hover:border-primary/30",
                friend.name && friend.phone && "border-primary/50 bg-primary/5"
              )}
            >
              {/* Background decoration */}
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/5 to-indigo-500/5 blur-2xl" />
              
              <div className="relative space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Друг #{index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`friend-name-${index}`} className="text-xs">
                      Имя друга
                    </Label>
                    <Input
                      id={`friend-name-${index}`}
                      value={friend.name}
                      onChange={(e) => handleFriendChange(index, 'name', e.target.value)}
                      placeholder="Например: Алия"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`friend-phone-${index}`} className="text-xs">
                      Телефон WhatsApp
                    </Label>
                    <Input
                      id={`friend-phone-${index}`}
                      value={friend.phone}
                      onChange={(e) => handleFriendChange(index, 'phone', e.target.value)}
                      placeholder="+7 700 123 45 67"
                      className="bg-background/50"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3 mt-6 pt-4 border-t"
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Запустить виральную петлю
              </>
            )}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

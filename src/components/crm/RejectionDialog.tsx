import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const rejectionReasons = [
  { id: 'expensive', label: 'Дорого', icon: '💰' },
  { id: 'competitor', label: 'Ушел к конкуренту', icon: '🏃' },
  { id: 'no_answer', label: 'Нет ответа', icon: '📵' },
  { id: 'other', label: 'Другое', icon: '📝' },
];

interface RejectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, customReason?: string) => void;
  leadName: string;
}

export const RejectionDialog = ({ open, onClose, onConfirm, leadName }: RejectionDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    const reason = selectedReason === 'other' 
      ? customReason || 'Другое' 
      : rejectionReasons.find(r => r.id === selectedReason)?.label || selectedReason;
    
    await onConfirm(selectedReason, reason);
    setIsSubmitting(false);
    setSelectedReason(null);
    setCustomReason('');
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            Причина отказа
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Клиент <span className="font-medium text-foreground">{leadName}</span> отказался. Выберите причину:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {rejectionReasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all text-left',
                  'hover:border-destructive/50 hover:bg-destructive/5',
                  selectedReason === reason.id 
                    ? 'border-destructive bg-destructive/10' 
                    : 'border-border'
                )}
              >
                {selectedReason === reason.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-2xl mb-2 block">{reason.icon}</span>
                <span className="text-sm font-medium">{reason.label}</span>
              </button>
            ))}
          </div>

          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Опишите причину</Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Укажите причину отказа..."
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? 'Сохранение...' : 'Подтвердить отказ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

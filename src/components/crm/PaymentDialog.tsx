import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  leadName: string;
}

export const PaymentDialog = ({ open, onClose, onConfirm, leadName }: PaymentDialogProps) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    await onConfirm(numAmount);
    setIsSubmitting(false);
    setAmount('');
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-success" />
            Оплата получена
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Клиент <span className="font-medium text-foreground">{leadName}</span> переведен в статус "Оплачено".
          </p>

          <div className="space-y-2">
            <Label htmlFor="amount">Сумма оплаты (₸)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Введите сумму"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            className="bg-success hover:bg-success/90"
          >
            {isSubmitting ? 'Сохранение...' : 'Подтвердить оплату'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

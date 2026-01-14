import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (appointmentDate: string) => void;
  leadName: string;
}

export const AppointmentDialog = ({ open, onClose, onConfirm, leadName }: AppointmentDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedDate) return;

    setIsSubmitting(true);
    const dateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    dateTime.setHours(hours, minutes, 0, 0);

    await onConfirm(dateTime.toISOString());
    setIsSubmitting(false);
    setSelectedDate(new Date());
    setSelectedTime('10:00');
  };

  const handleClose = () => {
    setSelectedDate(new Date());
    setSelectedTime('10:00');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-purple-500" />
            Запись на прием
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Клиент <span className="font-medium text-foreground">{leadName}</span> записывается на прием.
          </p>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Выберите дату</Label>
              <div className="mt-2 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ru}
                  className="rounded-lg border"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="time" className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Время
              </Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {selectedDate && (
              <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                <p className="text-sm font-medium text-purple-600">
                  {format(selectedDate, 'd MMMM yyyy', { locale: ru })} в {selectedTime}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || isSubmitting}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {isSubmitting ? 'Сохранение...' : 'Подтвердить запись'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarPage } from '@/components/calendar/CalendarPage';

interface CalendarButtonProps {
  projectId: string;
}

export const CalendarButton = ({ projectId }: CalendarButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">Календарь</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl h-[80vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Календарь записей
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            <CalendarPage projectId={projectId} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

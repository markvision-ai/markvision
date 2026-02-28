import { Lead } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  CheckSquare, 
  XSquare, 
  ArrowRight, 
  Loader2,
  MessageCircle,
  CheckCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const statusOptions = [
  { id: 'new', label: 'Новая', color: 'from-blue-500 to-cyan-500' },
  { id: 'in_progress', label: 'В работе', color: 'from-yellow-500 to-orange-500' },
  { id: 'no_answer', label: 'Недозвон', color: 'from-orange-500 to-red-500' },
  { id: 'appointment', label: 'Записан', color: 'from-purple-500 to-pink-500' },
  { id: 'paid', label: 'Оплачено', color: 'from-blue-500 to-green-500' },
  { id: 'cancelled', label: 'Отказ', color: 'from-red-500 to-rose-500' },
];

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  selectedLeads: Lead[];
  isLoading?: boolean;
}

export const BulkActionsBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  onStatusChange,
  selectedLeads,
  isLoading = false,
}: BulkActionsBarProps) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  const handleWhatsAppBulk = () => {
    const leadsWithPhone = selectedLeads.filter(l => l.phone);
    if (leadsWithPhone.length === 0) {
      return;
    }
    // Open WhatsApp for first lead (bulk WhatsApp requires API)
    const phone = leadsWithPhone[0].phone!.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      className="rounded-2xl p-4 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50 shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Выбрано: <span className="text-primary">{selectedCount}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                из {totalCount} лидов
              </p>
            </div>
          </div>

          {/* Select All / Clear buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-xs"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              {allSelected ? 'Снять выбор' : 'Выбрать все'}
            </Button>
            {selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-xs text-muted-foreground"
              >
                <XSquare className="w-4 h-4 mr-1" />
                Очистить
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          )}

          {/* Change Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedCount === 0 || isLoading}
                className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:border-primary/40"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Изменить статус
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50">
              <DropdownMenuLabel className="font-bold">Новый статус</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status.id}
                  onClick={() => onStatusChange(status.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full bg-gradient-to-r', status.color)} />
                    {status.label}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* WhatsApp (for leads with phones) */}
          <Button
            variant="outline"
            size="sm"
            disabled={selectedLeads.filter(l => l.phone).length === 0 || isLoading}
            onClick={handleWhatsAppBulk}
            className="bg-green-500/10 border-green-500/20 hover:border-green-500/40 text-green-600"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
            {selectedLeads.filter(l => l.phone).length > 0 && (
              <Badge className="ml-2 bg-green-500 text-white border-0 text-xs">
                {selectedLeads.filter(l => l.phone).length}
              </Badge>
            )}
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedCount === 0 || isLoading}
                className="bg-destructive/10 border-destructive/20 hover:border-destructive/40 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
                {selectedCount > 0 && (
                  <Badge className="ml-2 bg-destructive text-destructive-foreground border-0 text-xs">
                    {selectedCount}
                  </Badge>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  Удалить лидов?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Вы уверены, что хотите удалить <span className="font-bold text-foreground">{selectedCount}</span> лидов? 
                  Это действие нельзя отменить. Все данные, сообщения и история будут удалены безвозвратно.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Удалить {selectedCount} лидов
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
};

import { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onPresetChange?: (preset: PresetKey | 'custom') => void;
  align?: "start" | "center" | "end";
}

export type PresetKey = 'today' | 'yesterday' | 'last7' | 'week' | 'lastWeek' | 'month' | 'lastMonth';

const presets: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'yesterday', label: 'Вчера' },
  { key: 'last7', label: 'Последние 7 дн.' },
  { key: 'week', label: 'Эта неделя' },
  { key: 'lastWeek', label: 'Прошлая неделя' },
  { key: 'month', label: 'Этот месяц' },
  { key: 'lastMonth', label: 'Прошлый месяц' },
];

export const DateRangePicker = ({ dateRange, onDateRangeChange, onPresetChange, align = "end" }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Internal state for the picker, applied only on "Update"
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>({
    from: dateRange.from,
    to: dateRange.to,
  });
  const [activePreset, setActivePreset] = useState<PresetKey | 'custom'>('month');

  // Sync temp state when prop changes or popover opens
  useEffect(() => {
    if (isOpen) {
      setTempDateRange({ from: dateRange.from, to: dateRange.to });
      determineActivePreset(dateRange.from, dateRange.to);
    }
  }, [isOpen, dateRange]);

  const determineActivePreset = (from: Date, to: Date) => {
    const today = new Date();
    
    // Check if matches any preset
    if (isSameDay(from, today) && isSameDay(to, today)) return setActivePreset('today');
    if (isSameDay(from, subDays(today, 1)) && isSameDay(to, subDays(today, 1))) return setActivePreset('yesterday');
    if (isSameDay(from, subDays(today, 6)) && isSameDay(to, today)) return setActivePreset('last7');
    if (isSameDay(from, startOfWeek(today, { weekStartsOn: 1 })) && (isSameDay(to, endOfWeek(today, { weekStartsOn: 1 })) || isSameDay(to, today))) return setActivePreset('week');
    
    const lastWeek = subDays(today, 7);
    if (isSameDay(from, startOfWeek(lastWeek, { weekStartsOn: 1 })) && isSameDay(to, endOfWeek(lastWeek, { weekStartsOn: 1 }))) return setActivePreset('lastWeek');

    if (isSameDay(from, startOfMonth(today)) && (isSameDay(to, endOfMonth(today)) || isSameDay(to, today))) return setActivePreset('month');
    
    const lastMonth = subMonths(today, 1);
    if (isSameDay(from, startOfMonth(lastMonth)) && isSameDay(to, endOfMonth(lastMonth))) return setActivePreset('lastMonth');

    setActivePreset('custom');
  };

  const handlePresetClick = (preset: PresetKey) => {
    const today = new Date();
    let from: Date = today;
    let to: Date = today;

    switch (preset) {
      case 'today':
        from = today;
        to = today;
        break;
      case 'yesterday':
        from = subDays(today, 1);
        to = subDays(today, 1);
        break;
      case 'last7':
        from = subDays(today, 6);
        to = today;
        break;
      case 'week':
        from = startOfWeek(today, { weekStartsOn: 1 });
        to = endOfWeek(today, { weekStartsOn: 1 }); // Or today? usually week is full week range
        break;
      case 'lastWeek':
        const lastWeek = subDays(today, 7);
        from = startOfWeek(lastWeek, { weekStartsOn: 1 });
        to = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case 'month':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
    }

    setTempDateRange({ from, to });
    setActivePreset(preset);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setTempDateRange(range);
    setActivePreset('custom');
  };

  const handleUpdate = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      onDateRangeChange({ from: tempDateRange.from, to: tempDateRange.to });
      if (onPresetChange) {
        onPresetChange(activePreset);
      }
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const formatDateButton = () => {
    if (activePreset === 'today') {
      return `Сегодня: ${format(dateRange.from, 'd MMM yyyy', { locale: ru })} г.`;
    }
    if (activePreset === 'yesterday') {
      return `Вчера: ${format(dateRange.from, 'd MMM yyyy', { locale: ru })} г.`;
    }
    return `${format(dateRange.from, 'd MMM yyyy', { locale: ru })} - ${format(dateRange.to, 'd MMM yyyy', { locale: ru })}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "h-10 justify-between text-left font-normal bg-background hover:bg-accent hover:text-accent-foreground border-input",
            !dateRange && "text-muted-foreground",
            "min-w-[240px]"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 opacity-50" />
            <span className="truncate">{formatDateButton()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border-border shadow-xl rounded-xl overflow-hidden" align={align}>
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Sidebar - Presets */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-border bg-muted/10 p-2 md:w-48 gap-1">
            <span className="text-xs font-semibold text-muted-foreground px-3 py-2 mb-1">
              Быстрый выбор
            </span>
            {presets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetClick(preset.key)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-left",
                  activePreset === preset.key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted/50"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          {/* Right Main Area - Calendar & Actions */}
          <div className="flex flex-col">
            <div className="p-4">
              <Calendar
                mode="range"
                defaultMonth={tempDateRange?.from}
                selected={tempDateRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
                locale={ru}
                className="p-0 pointer-events-auto"
              />
            </div>
            
            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 p-3 border-t border-border bg-muted/5">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                Отмена
              </Button>
              <Button 
                size="sm" 
                onClick={handleUpdate}
                disabled={!tempDateRange?.from || !tempDateRange?.to}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                Обновить
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

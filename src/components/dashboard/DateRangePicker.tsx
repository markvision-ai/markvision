import { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

type PresetKey = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom';

const presets: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'yesterday', label: 'Вчера' },
  { key: 'week', label: 'Эта неделя' },
  { key: 'month', label: 'Этот месяц' },
  { key: 'lastMonth', label: 'Прошлый месяц' },
  { key: 'custom', label: 'Выбрать период' },
];

export const DateRangePicker = ({ dateRange, onDateRangeChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>('month');

  const handlePresetClick = (preset: PresetKey) => {
    if (preset === 'custom') {
      setActivePreset('custom');
      return;
    }

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
      case 'week':
        from = startOfWeek(today, { weekStartsOn: 1 });
        to = endOfWeek(today, { weekStartsOn: 1 });
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

    setActivePreset(preset);
    onDateRangeChange({ from, to });
    setIsOpen(false);
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setActivePreset('custom');
      onDateRangeChange({ from: range.from, to: range.to });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[220px] justify-start">
          <Calendar className="w-4 h-4" />
          <span>
            {format(dateRange.from, 'd MMM', { locale: ru })} — {format(dateRange.to, 'd MMM yyyy', { locale: ru })}
          </span>
          <ChevronDown className="w-4 h-4 ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-2 space-y-1">
            {presets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetClick(preset.key)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  activePreset === preset.key
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          {/* Calendar */}
          <div className="p-2">
            <CalendarComponent
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={ru}
              className="pointer-events-auto"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

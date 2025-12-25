import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save } from 'lucide-react';
import { CustomModelSettings as SettingsType } from '@/lib/attribution';

interface CustomModelSettingsProps {
  settings: SettingsType;
  onChange: (settings: SettingsType) => void;
}

export const CustomModelSettings = ({ settings, onChange }: CustomModelSettingsProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof SettingsType, value: number) => {
    const newSettings = { ...localSettings, [field]: value };
    
    // Auto-balance to 100%
    const total = newSettings.firstTouchWeight + newSettings.lastTouchWeight + newSettings.middleTouchesWeight;
    if (total !== 100) {
      // Adjust middle weight to compensate
      const diff = 100 - total;
      newSettings.middleTouchesWeight = Math.max(0, newSettings.middleTouchesWeight + diff);
    }
    
    setLocalSettings(newSettings);
  };

  const handleSave = () => {
    onChange(localSettings);
  };

  const handleReset = () => {
    const defaultSettings = {
      firstTouchWeight: 40,
      lastTouchWeight: 40,
      middleTouchesWeight: 20,
    };
    setLocalSettings(defaultSettings);
    onChange(defaultSettings);
  };

  const total = localSettings.firstTouchWeight + localSettings.lastTouchWeight + localSettings.middleTouchesWeight;

  return (
    <div className="mt-6 p-4 bg-secondary/50 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Настройка весов атрибуции</h4>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Сброс
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Применить
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* First Touch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Первое касание</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localSettings.firstTouchWeight}
                onChange={(e) => handleChange('firstTouchWeight', Number(e.target.value))}
                className="w-20 h-8 text-center"
                min={0}
                max={100}
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
          <Slider
            value={[localSettings.firstTouchWeight]}
            onValueChange={([value]) => handleChange('firstTouchWeight', value)}
            max={100}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Вес первого касания, которое привело клиента на сайт
          </p>
        </div>

        {/* Middle Touches */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Промежуточные касания</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localSettings.middleTouchesWeight}
                onChange={(e) => handleChange('middleTouchesWeight', Number(e.target.value))}
                className="w-20 h-8 text-center"
                min={0}
                max={100}
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
          <Slider
            value={[localSettings.middleTouchesWeight]}
            onValueChange={([value]) => handleChange('middleTouchesWeight', value)}
            max={100}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Суммарный вес всех касаний между первым и последним (делится поровну)
          </p>
        </div>

        {/* Last Touch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Последнее касание</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localSettings.lastTouchWeight}
                onChange={(e) => handleChange('lastTouchWeight', Number(e.target.value))}
                className="w-20 h-8 text-center"
                min={0}
                max={100}
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
          <Slider
            value={[localSettings.lastTouchWeight]}
            onValueChange={([value]) => handleChange('lastTouchWeight', value)}
            max={100}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Вес последнего касания перед конверсией
          </p>
        </div>
      </div>

      {/* Total Indicator */}
      <div className={`p-3 rounded-lg ${total === 100 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">Сумма весов:</span>
          <span className="font-bold">{total}%</span>
        </div>
        {total !== 100 && (
          <p className="text-xs mt-1">Сумма должна быть равна 100%</p>
        )}
      </div>

      {/* Visual Preview */}
      <div className="space-y-2">
        <Label>Визуализация распределения</Label>
        <div className="flex h-8 rounded-lg overflow-hidden">
          <div 
            className="bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium"
            style={{ width: `${localSettings.firstTouchWeight}%` }}
          >
            {localSettings.firstTouchWeight > 10 && `${localSettings.firstTouchWeight}%`}
          </div>
          <div 
            className="bg-accent flex items-center justify-center text-accent-foreground text-xs font-medium"
            style={{ width: `${localSettings.middleTouchesWeight}%` }}
          >
            {localSettings.middleTouchesWeight > 10 && `${localSettings.middleTouchesWeight}%`}
          </div>
          <div 
            className="bg-success flex items-center justify-center text-success-foreground text-xs font-medium"
            style={{ width: `${localSettings.lastTouchWeight}%` }}
          >
            {localSettings.lastTouchWeight > 10 && `${localSettings.lastTouchWeight}%`}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Первое</span>
          <span>Промежуточные</span>
          <span>Последнее</span>
        </div>
      </div>
    </div>
  );
};

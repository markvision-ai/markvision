import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rocket, DollarSign, Target, Calendar, ExternalLink, MapPin, Users, CalendarDays, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LaunchOrbitalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postData: {
    post_id: string;
    caption: string | null;
    media_url: string | null;
    permalink: string | null;
  };
}

const KAZAKHSTAN_CITIES = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Актобе',
  'Караганда',
  'Тараз',
  'Усть-Каменогорск',
  'Павлодар',
  'Семей',
  'Уральск',
  'Костанай',
  'Кызылорда',
  'Петропавловск',
  'Атырау',
  'Актау',
  'Туркестан',
  'Кокшетау',
  'Талдыкорган',
  'Экибастуз',
  'Рудный',
  'Жезказган',
  'Темиртау',
  'Кентау',
  'Балхаш',
  'Сарань',
  'Жанаозен',
  'Каскелен',
  'Риддер',
  'Степногорск',
  'Щучинск',
];

const AGE_RANGES = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-65',
  '65+',
];

export const LaunchOrbitalModal = ({ open, onOpenChange, postData }: LaunchOrbitalModalProps) => {
  const [budget, setBudget] = useState<number>(50000);
  const [city, setCity] = useState<string>('Алматы');
  const [gender, setGender] = useState<string>('all');
  const [ageRange, setAgeRange] = useState<string>('18-65+');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>('');
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const durationText = hasEndDate && endDate 
      ? `с ${format(new Date(startDate), 'd MMMM', { locale: ru })} по ${format(new Date(endDate), 'd MMMM', { locale: ru })}`
      : `с ${format(new Date(startDate), 'd MMMM', { locale: ru })} (до ручного отключения)`;
    
    toast.success(`Продвижение запущено! Бюджет: ${budget.toLocaleString('ru-RU')} ₸`, {
      description: `Пост будет продвигаться ${durationText}`
    });
    
    setLaunching(false);
    onOpenChange(false);
  };

  const estimatedReach = Math.round(budget * 10); // Примерный охват
  const estimatedLeads = Math.round(budget / 500); // Примерное кол-во лидов
  const cpl = estimatedLeads > 0 ? Math.round(budget / estimatedLeads) : 0;
  const cpm = estimatedReach > 0 ? Math.round((budget / estimatedReach) * 1000) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Продвижение поста
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Настройте параметры таргетинга и запустите рекламу
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Preview - Apple стиль */}
          {postData.media_url && (
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted/20 shadow-sm">
              {postData.media_url.includes('video') || postData.media_url.includes('.mp4') ? (
                <div className="relative">
                  <video 
                    src={postData.media_url} 
                    className="w-full h-[280px] object-cover"
                    controls={false}
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                  </div>
                </div>
              ) : (
                <img 
                  src={postData.media_url} 
                  alt="Post preview" 
                  className="w-full h-[280px] object-cover"
                  style={{ objectPosition: 'right center' }}
                />
              )}
              {postData.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                  <p className="text-white text-sm line-clamp-2 font-medium leading-relaxed">
                    {postData.caption}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Таргетинг - Apple стиль */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-foreground">Таргетинг</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Гео */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-foreground">
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                  Гео
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger id="city" className="w-full h-10">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {KAZAKHSTAN_CITIES.map((cityName) => (
                      <SelectItem key={cityName} value={cityName}>
                        {cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Пол */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-foreground">
                  <Users className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                  Пол
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="female">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Возраст */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-foreground">
                  Возраст
                </Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger id="age" className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-65+">18-65+</SelectItem>
                    {AGE_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Расписание - Apple стиль */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-foreground">Расписание</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Дата запуска */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium text-foreground">
                  <CalendarDays className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                  Дата запуска
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full h-10"
                />
              </div>

              {/* Дата окончания */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="hasEndDate"
                    checked={hasEndDate}
                    onChange={(e) => {
                      setHasEndDate(e.target.checked);
                      if (!e.target.checked) {
                        setEndDate('');
                      }
                    }}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <Label htmlFor="hasEndDate" className="text-sm font-medium text-foreground cursor-pointer">
                    Дата окончания (необязательно)
                  </Label>
                </div>
                {hasEndDate ? (
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full h-10"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground pl-6">
                    Реклама будет работать до ручного отключения
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Бюджет - Apple стиль */}
          <div className="space-y-2">
            <Label htmlFor="budget" className="text-sm font-medium text-foreground">
              <DollarSign className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Бюджет
            </Label>
            <div className="relative">
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-10 pr-12 text-base"
                min={1000}
                step={1000}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                ₸
              </span>
            </div>
            <p className="text-xs text-muted-foreground pl-5">
              Рекомендуем: от 30,000₸ для эффективного охвата
            </p>
          </div>

          {/* Прогнозируемые результаты - Apple стиль */}
          <div className="bg-muted/30 rounded-xl p-5 space-y-4 border border-border/50">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Прогнозируемые результаты
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Охват</p>
                <p className="text-xl font-semibold text-foreground">
                  {estimatedReach.toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Лиды</p>
                <p className="text-xl font-semibold text-foreground">
                  ~{estimatedLeads}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
                CPL: {cpl.toLocaleString('ru-RU')} ₸
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
                CPM: {cpm.toLocaleString('ru-RU')} ₸
              </Badge>
            </div>
          </div>

          {/* Actions - Apple стиль */}
          <div className="flex gap-3 pt-4 border-t border-border/50">
            {postData.permalink && (
              <Button
                variant="outline"
                className="flex-1 gap-2 h-11"
                onClick={() => window.open(postData.permalink!, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Открыть пост
              </Button>
            )}
            <Button
              className={cn(
                "flex-1 gap-2 h-11 font-semibold",
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                "shadow-sm hover:shadow-md transition-all"
              )}
              onClick={handleLaunch}
              disabled={launching}
            >
              <Rocket className="w-4 h-4" />
              {launching ? 'Запускаем...' : 'Запустить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

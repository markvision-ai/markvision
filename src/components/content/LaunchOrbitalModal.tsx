import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rocket, DollarSign, Target, Calendar, ExternalLink, MapPin, Users, CalendarDays, Play, Sparkles } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background/80 backdrop-blur-2xl border-border/40 shadow-2xl rounded-3xl outline-none">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/40 sticky top-0 bg-background/60 backdrop-blur-md z-10">
          <DialogTitle className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
               <Rocket className="w-5 h-5 text-primary" />
            </div>
            Продвижение поста
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pl-[52px]">
            Настройте параметры таргетинга и запустите рекламу
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-8 space-y-8">
          {/* Preview - Apple стиль */}
          {postData.media_url && (
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted/20 shadow-sm group">
              {postData.media_url.includes('video') || postData.media_url.includes('.mp4') ? (
                <div className="relative">
                  <video 
                    src={postData.media_url} 
                    className="w-full h-[320px] object-cover"
                    controls={false}
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <img 
                  src={postData.media_url} 
                  alt="Post preview" 
                  className="w-full h-[320px] object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: 'center' }}
                />
              )}
              {postData.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-12">
                  <p className="text-white text-sm line-clamp-2 font-medium leading-relaxed tracking-wide">
                    {postData.caption}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Таргетинг - Apple стиль */}
          <div className="space-y-4 p-6 bg-muted/20 rounded-2xl border border-border/40">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
               <Users className="w-4 h-4 text-primary" />
               Таргетинг
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Гео */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-muted-foreground">
                  Гео
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger id="city" className="w-full h-11 rounded-xl border-border/40 bg-background/50 focus:bg-background transition-all">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 bg-background/90 backdrop-blur-xl">
                    {KAZAKHSTAN_CITIES.map((cityName) => (
                      <SelectItem key={cityName} value={cityName} className="rounded-lg">
                        {cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Пол */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-muted-foreground">
                  Пол
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="w-full h-11 rounded-xl border-border/40 bg-background/50 focus:bg-background transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 bg-background/90 backdrop-blur-xl">
                    <SelectItem value="all" className="rounded-lg">Все</SelectItem>
                    <SelectItem value="male" className="rounded-lg">Мужской</SelectItem>
                    <SelectItem value="female" className="rounded-lg">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Возраст */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-muted-foreground">
                  Возраст
                </Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger id="age" className="w-full h-11 rounded-xl border-border/40 bg-background/50 focus:bg-background transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 bg-background/90 backdrop-blur-xl">
                    <SelectItem value="18-65+" className="rounded-lg">18-65+</SelectItem>
                    {AGE_RANGES.map((range) => (
                      <SelectItem key={range} value={range} className="rounded-lg">
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Расписание - Apple стиль */}
          <div className="space-y-4 p-6 bg-muted/20 rounded-2xl border border-border/40">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
               <Calendar className="w-4 h-4 text-primary" />
               Расписание
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Дата запуска */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium text-muted-foreground">
                  Дата запуска
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full h-11 rounded-xl border-border/40 bg-background/50 focus:bg-background transition-all"
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
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <Label htmlFor="hasEndDate" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Дата окончания
                  </Label>
                </div>
                {hasEndDate ? (
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full h-11 rounded-xl border-border/40 bg-background/50 focus:bg-background transition-all animate-in fade-in-0 zoom-in-95 duration-200"
                  />
                ) : (
                  <div className="h-11 flex items-center px-4 rounded-xl border border-border/20 bg-muted/30 text-xs text-muted-foreground">
                    Реклама будет работать до ручного отключения
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Бюджет - Apple стиль */}
          <div className="space-y-3">
            <Label htmlFor="budget" className="text-sm font-medium text-foreground pl-1">
              Бюджет (тенге)
            </Label>
            <div className="relative">
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-14 pl-4 pr-12 text-2xl font-semibold rounded-xl border-border/40 bg-background/50 focus:bg-background transition-all shadow-sm"
                min={1000}
                step={1000}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                ₸
              </span>
            </div>
            <p className="text-xs text-muted-foreground pl-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              Рекомендуем: от 30,000₸ для эффективного охвата
            </p>
          </div>

          {/* Прогнозируемые результаты - Apple стиль */}
          <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl p-6 space-y-4 border border-primary/10">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Прогнозируемые результаты
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-5 border border-primary/5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Охват</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  {estimatedReach.toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-5 border border-primary/5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Лиды</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  ~{estimatedLeads}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Badge variant="outline" className="bg-background/40 backdrop-blur-sm border-primary/10 text-xs font-medium px-3 py-1 text-muted-foreground">
                CPL: {cpl.toLocaleString('ru-RU')} ₸
              </Badge>
              <Badge variant="outline" className="bg-background/40 backdrop-blur-sm border-primary/10 text-xs font-medium px-3 py-1 text-muted-foreground">
                CPM: {cpm.toLocaleString('ru-RU')} ₸
              </Badge>
            </div>
          </div>

          {/* Actions - Apple стиль */}
          <div className="flex gap-4 pt-6 border-t border-border/40 sticky bottom-0 bg-background/80 backdrop-blur-xl p-6 -mx-8 -mb-8">
            {postData.permalink && (
              <Button
                variant="outline"
                className="flex-1 gap-2 h-12 rounded-xl border-border/40 hover:bg-background hover:border-primary/30 transition-all"
                onClick={() => window.open(postData.permalink!, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Открыть пост
              </Button>
            )}
            <Button
              className={cn(
                "flex-[2] gap-2 h-12 font-semibold text-base rounded-xl",
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                "shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
              )}
              onClick={handleLaunch}
              disabled={launching}
            >
              <Rocket className="w-5 h-5" />
              {launching ? 'Запускаем...' : 'Запустить продвижение'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

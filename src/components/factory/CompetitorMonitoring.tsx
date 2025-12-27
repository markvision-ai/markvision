import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ExternalLink, Clock, Instagram, MessageCircle } from 'lucide-react';
import { Competitor } from '@/hooks/useContentFactory';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CompetitorMonitoringProps {
  competitors: Competitor[];
  onAdd: (accountHandle: string, platform: string) => Promise<Competitor | null>;
  onRemove: (id: string) => Promise<boolean>;
}

const platformConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  instagram: { label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
  tiktok: { label: 'TikTok', icon: <MessageCircle className="w-4 h-4" /> },
};

export const CompetitorMonitoring = ({
  competitors,
  onAdd,
  onRemove,
}: CompetitorMonitoringProps) => {
  const [newHandle, setNewHandle] = useState('');
  const [newPlatform, setNewPlatform] = useState('instagram');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newHandle.trim()) return;
    
    setIsAdding(true);
    const result = await onAdd(newHandle.trim(), newPlatform);
    setIsAdding(false);
    
    if (result) {
      setNewHandle('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Competitor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Добавить конкурента</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="@username или ссылка на профиль"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Select value={newPlatform} onValueChange={setNewPlatform}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={isAdding || !newHandle.trim()} className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Competitors List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Отслеживаемые аккаунты</CardTitle>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет отслеживаемых конкурентов</p>
              <p className="text-sm mt-1">Добавьте аккаунты для мониторинга идей</p>
            </div>
          ) : (
            <div className="space-y-3">
              {competitors.map((competitor) => {
                const platform = platformConfig[competitor.platform] || platformConfig.instagram;
                
                return (
                  <div
                    key={competitor.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white">
                        {platform.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{competitor.account_handle}</span>
                          <Badge variant="secondary" className="text-xs">
                            {platform.label}
                          </Badge>
                        </div>
                        {competitor.last_scanned_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            Сканировано: {format(new Date(competitor.last_scanned_at), 'dd MMM HH:mm', { locale: ru })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(
                          competitor.platform === 'instagram'
                            ? `https://instagram.com/${competitor.account_handle.replace('@', '')}`
                            : `https://tiktok.com/${competitor.account_handle}`,
                          '_blank'
                        )}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(competitor.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ideas Feed Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Свежие идеи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Идеи появятся после сканирования n8n</p>
            <p className="text-sm mt-1">Настройте webhook в интеграциях для автоматического сбора</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

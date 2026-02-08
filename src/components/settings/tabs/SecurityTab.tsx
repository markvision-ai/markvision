import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Shield,
  User,
  Clock,
  Filter,
  Search,
  ChevronDown,
  Activity,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Loader2,
  Key,
  Smartphone,
  Lock,
  Globe,
  Monitor,
  Copy,
  Check,
  QrCode,
  MapPin,
  Zap,
  Bell,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SecurityTabProps {
  projectId: string;
}

// Mock data for demonstration
const mockSessions = [
  { id: '1', device: 'MacBook Pro', browser: 'Chrome 120', ip: '192.168.1.1', location: 'Алматы, Казахстан', lastActivity: new Date(), isCurrent: true },
  { id: '2', device: 'iPhone 15', browser: 'Safari', ip: '192.168.1.50', location: 'Алматы, Казахстан', lastActivity: new Date(Date.now() - 3600000), isCurrent: false },
];

const mockApiKeys = [
  { id: '1', name: 'Production API', key: 'mk_live_••••••••••••1234', permissions: 'admin', created: new Date('2024-01-15'), lastUsed: new Date(), requests: 15420 },
  { id: '2', name: 'Development', key: 'mk_test_••••••••••••5678', permissions: 'read', created: new Date('2024-02-01'), lastUsed: new Date(Date.now() - 86400000), requests: 892 },
];

export const SecurityTab = ({ projectId }: SecurityTabProps) => {
  const { isAdmin, user } = useAuth();
  const [activeSection, setActiveSection] = useState('sessions');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Password Policy State
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireSpecial: true,
    requireNumber: true,
    requireUppercase: true,
    expiryDays: 90,
    historyCount: 5
  });

  // IP Whitelist State
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [whitelistedIps, setWhitelistedIps] = useState<string[]>(['192.168.1.0/24']);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Доступ ограничен</h3>
          <p className="text-white/40">Только администраторы могут управлять настройками безопасности</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-black/40 to-cyan-500/10 border border-white/5 p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Безопасность</h2>
                <p className="text-white/40 mt-1">Управление доступом и защита данных</p>
              </div>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Защищено
          </Badge>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl backdrop-blur-xl">
          <TabsTrigger value="sessions" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white gap-2">
            <Monitor className="w-4 h-4" />
            Сессии
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white gap-2">
            <Key className="w-4 h-4" />
            API Ключи
          </TabsTrigger>
          <TabsTrigger value="2fa" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white gap-2">
            <Smartphone className="w-4 h-4" />
            2FA
          </TabsTrigger>
          <TabsTrigger value="password" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white gap-2">
            <Lock className="w-4 h-4" />
            Пароли
          </TabsTrigger>
          <TabsTrigger value="ip-whitelist" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white gap-2">
            <Globe className="w-4 h-4" />
            IP Whitelist
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Активные сессии</CardTitle>
                    <CardDescription>Устройства, с которых выполнен вход в систему</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20">
                    <LogOut className="w-4 h-4" />
                    Завершить все
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-4 rounded-2xl border transition-all",
                        session.isCurrent
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-xl",
                            session.isCurrent ? "bg-emerald-500/20" : "bg-white/10"
                          )}>
                            <Monitor className={cn("w-5 h-5", session.isCurrent ? "text-emerald-400" : "text-white/60")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{session.device}</p>
                              {session.isCurrent && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                  Текущая
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-white/40">{session.browser}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {session.ip}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {session.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(session.lastActivity, 'dd MMM HH:mm', { locale: ru })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">API Ключи</CardTitle>
                    <CardDescription>Управление ключами для интеграций</CardDescription>
                  </div>
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Создать ключ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockApiKeys.map((apiKey) => (
                    <motion.div
                      key={apiKey.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 rounded-xl bg-primary/20">
                            <Key className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white">{apiKey.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {apiKey.permissions}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm text-white/60 font-mono bg-black/40 px-3 py-1 rounded-lg">
                                {apiKey.key}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleCopy(apiKey.key, apiKey.id)}
                              >
                                {copied === apiKey.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-white/40">
                              <span>Создан: {format(apiKey.created, 'dd MMM yyyy', { locale: ru })}</span>
                              <span>Последнее использование: {format(apiKey.lastUsed, 'dd MMM HH:mm', { locale: ru })}</span>
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {apiKey.requests.toLocaleString()} запросов
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* 2FA Tab */}
        <TabsContent value="2fa" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Двухфакторная аутентификация</CardTitle>
                <CardDescription>Дополнительный уровень защиты вашего аккаунта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      twoFactorEnabled ? "bg-emerald-500/20" : "bg-white/10"
                    )}>
                      <Smartphone className={cn("w-5 h-5", twoFactorEnabled ? "text-emerald-400" : "text-white/60")} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Статус 2FA</p>
                      <p className="text-sm text-white/40">
                        {twoFactorEnabled ? 'Включена' : 'Отключена'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      setTwoFactorEnabled(checked);
                      if (checked) setShowQrCode(true);
                    }}
                  />
                </div>

                {twoFactorEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/20">
                      <div className="flex items-center gap-4 mb-4">
                        <QrCode className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold text-white">Настройка аутентификатора</p>
                          <p className="text-sm text-white/40">Отсканируйте QR-код в приложении Google Authenticator</p>
                        </div>
                      </div>
                      <div className="flex justify-center p-6 bg-white rounded-2xl">
                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                          <QrCode className="w-24 h-24 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                      <Download className="w-4 h-4" />
                      Скачать резервные коды
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Password Policy Tab */}
        <TabsContent value="password" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Политика паролей</CardTitle>
                <CardDescription>Требования к безопасности паролей</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-white">Минимальная длина пароля</Label>
                      <span className="text-sm text-white/60">{passwordPolicy.minLength} символов</span>
                    </div>
                    <Slider
                      value={[passwordPolicy.minLength]}
                      onValueChange={([value]) => setPasswordPolicy({ ...passwordPolicy, minLength: value })}
                      min={6}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white">Специальные символы</span>
                      </div>
                      <Switch
                        checked={passwordPolicy.requireSpecial}
                        onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireSpecial: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white">Цифры</span>
                      </div>
                      <Switch
                        checked={passwordPolicy.requireNumber}
                        onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireNumber: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white">Заглавные буквы</span>
                      </div>
                      <Switch
                        checked={passwordPolicy.requireUppercase}
                        onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white">Срок действия: {passwordPolicy.expiryDays} дней</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                  <Check className="w-4 h-4" />
                  Сохранить политику
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* IP Whitelist Tab */}
        <TabsContent value="ip-whitelist" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Белый список IP</CardTitle>
                    <CardDescription>Ограничение доступа по IP-адресам</CardDescription>
                  </div>
                  <Switch
                    checked={ipWhitelistEnabled}
                    onCheckedChange={setIpWhitelistEnabled}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    <p className="font-semibold text-white">Ваш текущий IP</p>
                  </div>
                  <code className="text-sm text-cyan-400 font-mono">192.168.1.100</code>
                </div>

                {ipWhitelistEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    {whitelistedIps.map((ip, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <Globe className="w-4 h-4 text-white/60" />
                        <code className="flex-1 text-sm text-white font-mono">{ip}</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <Button className="w-full gap-2 bg-white/5 hover:bg-white/10 border border-white/10">
                      <Plus className="w-4 h-4" />
                      Добавить IP адрес
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

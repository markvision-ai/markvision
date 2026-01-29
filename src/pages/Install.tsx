import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Share, 
  Plus,
  Sparkles,
  Zap,
  Shield,
  Wifi,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Мгновенный доступ',
      description: 'Запуск одним нажатием с главного экрана'
    },
    {
      icon: <Wifi className="w-5 h-5" />,
      title: 'Работает офлайн',
      description: 'Просмотр данных даже без интернета'
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Push-уведомления',
      description: 'Мгновенные алерты о новых лидах'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Безопасность',
      description: 'Ваши данные защищены на устройстве'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              MarkVision AI
            </h1>
            <p className="text-muted-foreground mt-2">
              Установите приложение на ваше устройство
            </p>
          </div>
        </div>

        {/* Status Card */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {isInstalled ? (
                <motion.div
                  key="installed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-success">Приложение установлено!</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      MarkVision AI теперь доступен на вашем устройстве
                    </p>
                  </div>
                  <Button asChild className="w-full">
                    <a href="/">Открыть приложение</a>
                  </Button>
                </motion.div>
              ) : isIOS ? (
                <motion.div
                  key="ios"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 text-center justify-center">
                    <Smartphone className="w-6 h-6 text-primary" />
                    <span className="font-medium">Установка на iOS</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        1
                      </div>
                      <div>
                        Нажмите кнопку <Share className="w-4 h-4 inline text-primary" /> <strong>Поделиться</strong> в Safari
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        2
                      </div>
                      <div>
                        Выберите <Plus className="w-4 h-4 inline text-primary" /> <strong>На экран «Домой»</strong>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        3
                      </div>
                      <div>
                        Нажмите <strong>Добавить</strong> в правом верхнем углу
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : deferredPrompt ? (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <Download className="w-12 h-12 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold">Готово к установке</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Нажмите кнопку ниже для установки
                    </p>
                  </div>
                  <Button 
                    onClick={handleInstallClick} 
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Download className="w-5 h-5" />
                    Установить MarkVision AI
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="browser"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold">Установка через браузер</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Откройте меню браузера и выберите «Добавить на главный экран»
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Chrome • Edge • Samsung Internet
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                    {feature.icon}
                  </div>
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Back link */}
        <div className="text-center">
          <Button variant="ghost" asChild>
            <a href="/">← Вернуться в приложение</a>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default InstallPage;
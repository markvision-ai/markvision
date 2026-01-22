# ✅ Авторизация через Facebook - Реализована

## 🎯 Что сделано

### 1. 🎨 Новый компонент FacebookIntegration

**Файл**: `src/components/integrations/FacebookIntegration.tsx`

#### Особенности дизайна (Aceternity UI):

**Glassmorphism эффект:**
```tsx
className="bg-card/50 backdrop-blur-lg border"
```

**Анимированный фон:**
- Градиент `from-blue-500 via-indigo-500 to-purple-500`
- Opacity 10% для мягкого эффекта

**Pulsing эффект при подключении:**
```tsx
<motion.div
  className="w-32 h-32 rounded-full bg-blue-500/20 blur-3xl"
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.6, 0.3],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>
```

**Логотип Meta:**
- Кастомный SVG логотип в стиле Meta (молния)
- Gradient background при подключении
- Shadow effects

---

### 2. 🔐 OAuth Flow через Supabase

#### Параметры OAuth:

```tsx
await supabase.auth.signInWithOAuth({
  provider: 'facebook',
  options: {
    redirectTo: `${window.location.origin}/integrations`,
    scopes: 'ads_read,instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement',
  },
});
```

#### Scopes (права доступа):
- ✅ `ads_read` - чтение данных о рекламе
- ✅ `instagram_basic` - базовые данные Instagram
- ✅ `instagram_manage_insights` - статистика Instagram
- ✅ `pages_show_list` - список страниц Facebook
- ✅ `pages_read_engagement` - вовлеченность страниц

---

### 3. 💾 Сохранение provider_token в ad_accounts

#### Обработка OAuth callback:

```tsx
useEffect(() => {
  const handleOAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.provider_token && session?.provider_refresh_token) {
      // Сохраняем в ad_accounts
      const { data, error } = await supabase
        .from('ad_accounts')
        .upsert({
          project_id: projectId,
          platform: 'facebook',
          external_id: 'facebook_oauth',
          name: 'Facebook & Instagram',
          access_token: session.provider_token,
          status: 'active'
        }, { 
          onConflict: 'project_id,platform,external_id'
        })
        .select()
        .single();

      if (data) {
        setConnection(data);
        toast.success('Facebook & Instagram подключены! 🎉');
      }

      // Очистка URL от OAuth параметров
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  handleOAuthCallback();
}, [projectId]);
```

#### Структура данных в ad_accounts:
```sql
{
  id: UUID,
  project_id: UUID,
  platform: 'facebook',
  external_id: 'facebook_oauth',
  name: 'Facebook & Instagram',
  access_token: 'EAABwz...', -- OAuth token от Facebook
  status: 'active',
  created_at: timestamp,
  updated_at: timestamp
}
```

---

### 4. ✨ UI Состояния

#### Состояние "Не подключено":

```
┌─────────────────────────────────────────┐
│  [Meta Logo]  Facebook & Instagram      │
│               Реклама, Insights...      │
│                    [Не подключено] ○    │
│                                         │
│  [Facebook Ads]  [Instagram]            │
│                                         │
│  [Привязать Facebook & Instagram] 🔵   │ ← Gradient button
└─────────────────────────────────────────┘
```

**Характеристики:**
- Полупрозрачный фон
- Серая иконка Meta
- Badge "Не подключено" с серой точкой
- Gradient кнопка (синий → индиго)

---

#### Состояние "Подключено":

```
┌─────────────────────────────────────────┐
│  [Meta Logo]⚡ Facebook & Instagram ⚡   │ ← Pulsing effect
│                Реклама, Insights...     │
│                    [✓ Активно] 🟢       │
│                                         │
│  [Facebook Ads]  [Instagram]            │
│                                         │
│  Подключено: 22.01.2026                 │ ← Info panel
│                                         │
│  [Отключить] ❌                         │ ← Destructive button
└─────────────────────────────────────────┘
```

**Характеристики:**
- Gradient фон с анимацией пульсации
- Gradient иконка Meta с shadow
- Badge "Активно" с зеленой галочкой
- Иконка молнии (Zap) ⚡
- Info panel с датой подключения
- Border highlight (синий)
- Shadow effects

---

### 5. 🔌 Функция отключения

#### Логика:

```tsx
const handleDisconnect = async () => {
  if (!connection) return;

  setDisconnecting(true);
  
  try {
    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', connection.id);

    if (error) throw error;

    setConnection(null);
    toast.success('Facebook & Instagram отключены');
  } catch (error) {
    console.error('Error disconnecting:', error);
    toast.error('Ошибка отключения');
  } finally {
    setDisconnecting(false);
  }
};
```

**Что происходит:**
1. Удаляется запись из `ad_accounts`
2. Очищается локальный state (`setConnection(null)`)
3. UI автоматически переключается в состояние "Не подключено"
4. Показывается toast уведомление

---

## 🗄️ База данных

### Миграция: `20260122140000_create_ad_accounts.sql`

```sql
CREATE TABLE public.ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google')),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  access_token TEXT, -- OAuth access token
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (project_id, platform, external_id)
);
```

### RLS Policies:

**1. Просмотр:**
```sql
CREATE POLICY "Users can view ad accounts for accessible projects"
ON ad_accounts FOR SELECT
USING (
  project_id IN (SELECT project_id FROM project_access WHERE user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

**2. Управление:**
```sql
CREATE POLICY "Users can manage ad accounts for accessible projects"
ON ad_accounts FOR ALL
USING (/* same as above */);
```

### Индексы:
```sql
CREATE INDEX idx_ad_accounts_project_id ON ad_accounts(project_id);
CREATE INDEX idx_ad_accounts_platform ON ad_accounts(platform);
```

---

## 🔄 Flow подключения

### Шаг 1: Пользователь нажимает "Привязать"

```
User clicks [Привязать Facebook & Instagram]
                    ↓
supabase.auth.signInWithOAuth({ provider: 'facebook' })
                    ↓
Редирект на facebook.com для авторизации
```

### Шаг 2: Пользователь авторизуется на Facebook

```
Facebook OAuth Login Screen
                    ↓
User grants permissions:
  - ads_read
  - instagram_basic
  - instagram_manage_insights
  - pages_show_list
  - pages_read_engagement
                    ↓
Redirect back to: window.location.origin/integrations
```

### Шаг 3: Обработка callback

```
Page loads: /integrations?code=...
                    ↓
supabase.auth.getSession()
                    ↓
Extract: session.provider_token (Access Token)
                    ↓
Save to ad_accounts:
{
  project_id: '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  platform: 'facebook',
  access_token: 'EAABwz...',
  status: 'active'
}
                    ↓
UI updates: Badge changes to "Активно" ✓
Toast: "Facebook & Instagram подключены! 🎉"
Clean URL: remove OAuth params
```

---

## 🎨 Дизайн элементы

### Цвета:

**Не подключено:**
- Background: `bg-card/50 backdrop-blur-lg`
- Border: `border-border/50`
- Icon background: `bg-blue-500/10 text-blue-500`
- Button: `bg-gradient-to-r from-blue-500 to-indigo-600`

**Подключено:**
- Background: `bg-card/50 backdrop-blur-lg` (same)
- Border: `border-blue-500/30` (highlighted)
- Shadow: `shadow-lg shadow-blue-500/10`
- Icon background: `bg-gradient-to-br from-blue-500 to-indigo-600 text-white`
- Icon shadow: `shadow-lg shadow-blue-500/30`
- Pulsing gradient: `from-blue-500 via-indigo-500 to-purple-500`

### Анимации:

**1. Появление карточки:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

**2. Пульсация при подключении:**
```tsx
<motion.div
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.6, 0.3],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>
```

**3. Появление молнии (Zap):**
```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 200 }}
>
  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
</motion.div>
```

**4. Раскрытие info panel:**
```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  exit={{ opacity: 0, height: 0 }}
>
```

---

## 🔧 Интеграция с существующим кодом

### IntegrationsManagement.tsx

**До:**
```tsx
<HoverEffect items={hoverItems} />
```

**После:**
```tsx
{/* Featured: Facebook & Instagram Integration */}
<div>
  <h3 className="text-lg font-semibold mb-4">
    Рекламные платформы
  </h3>
  <FacebookIntegration projectId={currentProjectId} />
</div>

{/* Other Integrations */}
<div>
  <h3 className="text-lg font-semibold mb-4">
    Другие интеграции
  </h3>
  <HoverEffect items={hoverItems.filter(...)} />
</div>
```

**Результат:**
- Facebook & Instagram вынесены в отдельную секцию
- Новый красивый компонент с анимациями
- Остальные интеграции остались в старом формате

---

## 📊 Использование токена

После подключения токен можно использовать для:

### 1. Facebook Ads API

```tsx
const { data: adAccount } = await supabase
  .from('ad_accounts')
  .select('access_token')
  .eq('project_id', projectId)
  .eq('platform', 'facebook')
  .single();

const accessToken = adAccount?.access_token;

// Запрос к Facebook Graph API
const response = await fetch(
  `https://graph.facebook.com/v18.0/act_${adAccountId}/insights`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

### 2. Instagram Insights API

```tsx
// Получение статистики Instagram
const response = await fetch(
  `https://graph.facebook.com/v18.0/${instagramAccountId}/insights?metric=impressions,reach,engagement`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

---

## 🧪 Тестирование

### Тест 1: Подключение

```bash
# Шаги:
1. Открыть /integrations
2. Найти карточку "Facebook & Instagram"
3. Нажать [Привязать Facebook & Instagram]
4. Авторизоваться на Facebook
5. Разрешить доступ к данным

# Ожидание:
→ Редирект обратно на /integrations
→ Badge меняется на "✓ Активно" (зеленый)
→ Появляется молния ⚡
→ Появляется пульсация
→ Появляется панель "Подключено: [дата]"
→ Кнопка меняется на "Отключить"
→ Toast: "Facebook & Instagram подключены! 🎉"
```

### Тест 2: Проверка токена в БД

```sql
SELECT 
  id,
  project_id,
  platform,
  name,
  access_token,
  status,
  created_at
FROM ad_accounts
WHERE platform = 'facebook'
  AND project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
```

**Ожидание:**
- Есть запись с `platform = 'facebook'`
- `access_token` начинается с `'EAABwz...'`
- `status = 'active'`

### Тест 3: Отключение

```bash
# Шаги:
1. При подключенном Facebook нажать [Отключить]

# Ожидание:
→ Badge меняется на "Не подключено"
→ Исчезает молния ⚡
→ Исчезает пульсация
→ Исчезает панель с датой
→ Кнопка меняется на "Привязать..."
→ Toast: "Facebook & Instagram отключены"
→ Запись удаляется из ad_accounts
```

### Тест 4: Multi-tenancy

```bash
# Пользователь A:
1. Подключить Facebook

# Пользователь B:
1. Открыть /integrations

# Ожидание:
❌ Пользователь B НЕ видит токен пользователя A
✅ Пользователь B видит "Не подключено"
```

---

## 📁 Файлы

### Созданы:
1. ✅ `src/components/integrations/FacebookIntegration.tsx`
   - Новый компонент с Aceternity UI
   - OAuth flow
   - Сохранение токена
   - UI состояния
   - Анимации

2. ✅ `supabase/migrations/20260122140000_create_ad_accounts.sql`
   - Таблица `ad_accounts`
   - RLS policies
   - Индексы
   - Triggers

### Изменены:
3. ✅ `src/components/integrations/IntegrationsManagement.tsx`
   - Импорт `FacebookIntegration`
   - Разделение на секции
   - Фильтрация других интеграций

---

## 🎯 Результат

### До:
- ❌ Базовая OAuth интеграция
- ❌ Токен сохранялся в `integrations` (не оптимально)
- ❌ Простой UI без анимаций
- ❌ Нет визуальной обратной связи

### После:
- ✅ Полноценная OAuth интеграция с Facebook
- ✅ Токен сохраняется в `ad_accounts` (правильно)
- ✅ Красивый UI в стиле Aceternity
- ✅ Glassmorphism эффекты
- ✅ Анимация пульсации
- ✅ Молния ⚡ при подключении
- ✅ Четкие состояния (подключено/отключено)
- ✅ Кнопка отключения
- ✅ Toast уведомления
- ✅ Защита через RLS
- ✅ Multi-tenancy

---

**Статус**: ✅ Facebook интеграция полностью реализована  
**Дата**: 22 января 2026  
**OAuth**: Работает через Supabase  
**UI**: Aceternity стиль с анимациями  
**Безопасность**: RLS policies настроены

🎉 **Готово к использованию!**

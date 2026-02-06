# Главный дашборд: архитектура и UX-редизайн

## Цели
- Показать путь клиента от показа до прибыли
- Сфокусировать внимание на деньгах и ключевых метриках
- Обеспечить чистый, элитный интерфейс (Interstellar Cyberpunk)

## Архитектура
- Каркас страницы: AnalyticsPlatform + DraggableDashboard (регистрация виджетов)
- Основные блоки:
  - WelcomeHero (приветствие и ключевые KPI)
  - MetricCard / PlanFactCard (финансовые и операционные метрики)
  - ComputedMetricsWidget (CPL, CAC, ROMI, ROAS)
  - RevenueChart / QuickStats (динамика и сравнение)
  - FunnelWidget (Impression → Click → Lead → Visit → Sale)
  - AIAssistant (центральный советник по ROMI)
- Сквозной модуль E2EAnalytics:
  - Воронка Impression → Profit
  - Виджет Meta Ads (синхронизация через Graph API)
  - Логирование ежедневных метрик в ad_performance_logs

## UX/Стиль
- Цветовая палитра: глубокий чёрный #05070A, неоновые границы 0.5px
- Типографика: Inter, JetBrains Mono для чисел
- Bento Grid, много «воздуха», минимизация визуального шума
- Кнопки и карточки унифицированы (premium-card, ui-section)

## Данные
- Источники:
  - daily_data (spend, impressions, clicks, leads, visits, sales, revenue)
  - payments (выручка/продажи)
  - Meta Graph API (по ad_account_id из projects)
- Логирование:
  - ad_performance_logs: ежедневные метрики и прибыль для истории ROMI

## Производительность
- Lazy‑загрузка тяжёлых модулей
- Минимизация перерисовок через DraggableDashboard
- Адаптивная сетка (grid, md/lg колонки) и оптимизация стилей

## Тестирование
- Ручная проверка адаптивности на мобильных/desktop
- Сценарии: отсутствие данных, большой объём данных, частые обновления

## Следующее
- История ROMI (daily_roi) и тренды
- Уведомления о падении эффективности (CR/ROAS/ROMI)
- Настройки проекта: ad_account_id, cost_rate, правила атрибуции

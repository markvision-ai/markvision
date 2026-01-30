# MarkVision AI - Руководство по Темизации (Light/Dark Mode)

## Обзор
Приложение поддерживает две темы: **Premium Light** и **Deep Dark**.
Темизация реализована через CSS переменные (CSS Custom Properties) и утилиты Tailwind CSS.

## Цветовая Палитра

### Семантические переменные
Используйте эти классы вместо жестко заданных цветов (например, `bg-white` или `bg-[#030303]`).

| Класс Tailwind | Описание | Light Mode (Пример) | Dark Mode (Пример) |
|---|---|---|---|
| `bg-background` | Основной фон страницы | White `#ffffff` | Deep Blue/Black `#020617` |
| `text-foreground` | Основной текст | Dark Slate `#0f172a` | White `#f8fafc` |
| `bg-card` | Фон карточек/панелей | Off-white `#fcfcfc` | Darker Blue `#0f172a` |
| `bg-muted` | Второстепенный фон | Light Gray `#f1f5f9` | Muted Dark `#1e293b` |
| `text-muted-foreground` | Второстепенный текст | Gray `#64748b` | Muted Gray `#94a3b8` |
| `border-border` | Границы элементов | Light Gray `#e2e8f0` | Dark Blue/Gray `#1e293b` |
| `bg-primary` | Акцентный цвет (кнопки) | Electric Blue | Electric Blue |
| `bg-secondary` | Вторичные элементы | Light Gray | Dark Blue |

### Правила использования

1. **Никогда не используйте хардкод**:
   ❌ Плохо: `bg-[#030303]`, `text-white`, `border-gray-800`
   ✅ Хорошо: `bg-background`, `text-foreground`, `border-border`

2. **Прозрачность и Glassmorphism**:
   Для эффекта стекла используйте семантические цвета с прозрачностью:
   ❌ Плохо: `bg-black/50`
   ✅ Хорошо: `bg-background/80` или `bg-card/50`

3. **Hover эффекты**:
   Используйте `hover:bg-accent` или `hover:bg-muted` для интерактивных элементов.

4. **Градиенты**:
   Если градиент нужен только в темной теме, используйте модификатор `dark:`:
   ```tsx
   <div className="bg-gradient-to-b from-transparent to-white dark:to-black" />
   ```

## Пример Компонента (Card)

```tsx
<div className="rounded-xl border border-border bg-card text-card-foreground shadow">
  <div className="p-6">
    <h3 className="font-semibold leading-none tracking-tight text-foreground">
      Заголовок
    </h3>
    <p className="text-sm text-muted-foreground">
      Описание карточки
    </p>
  </div>
</div>
```

## Accessibility (Доступность)
- Цвета подобраны для обеспечения контрастности WCAG AA.
- В светлой теме `text-muted-foreground` сделан темнее для лучшей читаемости.
- В темной теме `text-muted-foreground` сделан светлее.

## Переключение тем
Тема переключается добавлением класса `.dark` к тегу `<html>` или `<body>`.
Используйте хук `useTheme` (если есть) или системные настройки.

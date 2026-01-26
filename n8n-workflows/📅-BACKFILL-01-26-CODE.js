// =============================================================================
// БЭКФИЛЛ: 1–26 января 2026
// Вставь в ноду «📅 Рассчитать период» (Code). Выдаёт по одному элементу на КАЖДЫЙ
// день — дальше посты, агрегация и запись в Supabase идут за каждый день.
// После бэкфилла используй обычную связку «09:00 за вчера».
// =============================================================================

const start = new Date('2026-01-01');
const end = new Date('2026-01-26');
const result = [];

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const dayStr = d.toISOString().split('T')[0];
  const dayStart = new Date(dayStr);
  const periodStartTs = Math.floor(dayStart.getTime() / 1000);
  const periodEndTs = periodStartTs + 86399;

  result.push({
    json: {
      period_start: '2026-01-01',
      period_end: '2026-01-26',
      period_start_timestamp: Math.floor(start.getTime() / 1000),
      period_end_timestamp: Math.floor(end.getTime() / 1000) + 86399,
      yesterday_date: dayStr,
      today_date: '2026-01-26',
      yesterday_only_start: dayStr,
      yesterday_only_end: dayStr,
    },
  });
}

console.log(`📅 БЭКФИЛЛ: ${result.length} дней с 2026-01-01 по 2026-01-26`);
return result;

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface SeriesPoint {
  date: string;
  displayDate: string;
  spend: number;
  leads: number;
  visits: number;
  sales: number;
  revenue: number;
}

export const groupByPeriod = (data: SeriesPoint[], period: Period): SeriesPoint[] => {
  if (period === 'day') return data;
  const map = new Map<string, SeriesPoint>();
  for (const d of data) {
    let key = d.date;
    if (period === 'week') {
      const dt = new Date(d.date);
      const start = startOfWeek(dt, { weekStartsOn: 1 });
      key = format(start, 'yyyy-ww');
    } else if (period === 'month') {
      key = d.date.slice(0, 7);
    } else if (period === 'quarter') {
      const dt = new Date(d.date);
      const q = Math.floor(dt.getMonth() / 3) + 1;
      key = `${dt.getFullYear()}-Q${q}`;
    } else if (period === 'year') {
      key = d.date.slice(0, 4);
    }
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        date: key,
        displayDate: key,
        spend: d.spend,
        leads: d.leads,
        visits: d.visits,
        sales: d.sales,
        revenue: d.revenue,
      });
    } else {
      prev.spend += d.spend;
      prev.leads += d.leads;
      prev.visits += d.visits;
      prev.sales += d.sales;
      prev.revenue += d.revenue;
    }
  }
  return Array.from(map.values());
};

// Largest-Triangle-Three-Buckets downsampling for performance
export const downsampleLTTB = (data: SeriesPoint[], threshold = 1500, valueKey: keyof SeriesPoint = 'revenue'): SeriesPoint[] => {
  const n = data.length;
  if (threshold >= n || threshold === 0) return data;
  const sampled: SeriesPoint[] = [];
  const every = (n - 2) / (threshold - 2);
  sampled.push(data[0]);
  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const rangeStart = Math.floor((i + 1) * every) + 1;
    const rangeEnd = Math.floor((i + 2) * every) + 1;
    const range = data.slice(rangeStart, Math.min(rangeEnd, n));
    let avgX = 0;
    let avgY = 0;
    for (const r of range) {
      avgX += new Date(r.date).getTime();
      avgY += Number(r[valueKey] || 0);
    }
    avgX /= range.length || 1;
    avgY /= range.length || 1;
    const rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.floor((i + 1) * every) + 1;
    const pointRange = data.slice(rangeOffs, Math.min(rangeTo, n));
    let maxArea = -1;
    let maxAreaPoint = pointRange[0];
    for (let j = 0; j < pointRange.length; j++) {
      const p = pointRange[j];
      const ax = new Date(data[a].date).getTime();
      const ay = Number(data[a][valueKey] || 0);
      const px = new Date(p.date).getTime();
      const py = Number(p[valueKey] || 0);
      const area = Math.abs((ax - avgX) * (py - ay) - (ax - px) * (avgY - ay));
      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = p;
      }
    }
    sampled.push(maxAreaPoint);
    a = data.indexOf(maxAreaPoint);
  }
  sampled.push(data[n - 1]);
  return sampled;
};

import { describe, it, expect } from 'vitest';
import { groupByPeriod, downsampleLTTB } from '@/lib/chartUtils';

const makeData = (n: number) => {
  const base = new Date('2026-01-01').getTime();
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(base + i * 24 * 3600 * 1000);
    return {
      date: t.toISOString().slice(0, 10),
      displayDate: `${i + 1}`,
      spend: i,
      leads: i % 10,
      visits: i % 7,
      sales: i % 5,
      revenue: i * 2,
    };
  });
};

describe('chartUtils', () => {
  it('groups by month', () => {
    const data = makeData(40);
    const grouped = groupByPeriod(data, 'month');
    expect(grouped.length).toBeGreaterThan(1);
    expect(grouped[0].spend).toBeGreaterThan(0);
  });

  it('downsamples large arrays', () => {
    const data = makeData(10000);
    const ds = downsampleLTTB(data, 1500, 'revenue');
    expect(ds.length).toBeLessThanOrEqual(1500);
    expect(ds[0].date).toEqual(data[0].date);
    expect(ds[ds.length - 1].date).toEqual(data[data.length - 1].date);
  });
});

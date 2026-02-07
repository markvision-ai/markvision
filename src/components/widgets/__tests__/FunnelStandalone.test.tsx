import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FunnelStandalone } from '@/components/widgets/FunnelStandalone';

describe('FunnelStandalone', () => {
  it('renders stages and overall CR', () => {
    render(<FunnelStandalone steps={[
      { label: 'Показы', value: 1000, color: '#00f' },
      { label: 'Клики', value: 200, color: '#0af' },
      { label: 'Лиды', value: 50, color: '#a0f' },
      { label: 'Продажи', value: 10, color: '#0f0' },
    ]} />);

    expect(screen.getByText(/Воронка конверсии/i)).toBeDefined();
    expect(screen.getAllByText(/Показы/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Клики/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Лиды/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Продажи/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/CR общий/i)).toBeDefined();
  });
});

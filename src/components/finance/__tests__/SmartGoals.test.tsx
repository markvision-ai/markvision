import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartGoals } from '../SmartGoals';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock ResizeObserver for Recharts or other responsive components if any
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('SmartGoals Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders empty state initially', () => {
    render(<SmartGoals />);
    expect(screen.getByText('Нет активных целей')).toBeInTheDocument();
  });

  it('opens dialog when clicking add button', () => {
    render(<SmartGoals />);
    const addButton = screen.getByText('Добавить цель');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Создание SMART цели')).toBeInTheDocument();
    expect(screen.getByText('Specific (Конкретика)')).toBeInTheDocument();
  });

  it('validates step 1 (Specific)', async () => {
    render(<SmartGoals />);
    fireEvent.click(screen.getByText('Добавить цель'));
    
    const nextButton = screen.getByText('Далее');
    
    // Try clicking next without input
    fireEvent.click(nextButton);
    // Ideally check for toast error, but here we can check if tab didn't change
    expect(screen.getByText('Specific (Конкретика)')).toBeInTheDocument();

    // Fill inputs
    fireEvent.change(screen.getByLabelText('Название цели'), { target: { value: 'Test Goal' } });
    const specificInput = screen.getAllByLabelText('Specific (Конкретика)').find(el => el.tagName === 'TEXTAREA' || el.tagName === 'INPUT');
    if (specificInput) {
      fireEvent.change(specificInput, { target: { value: 'I want to increase revenue by 10% by end of year' } });
    }
    
    fireEvent.click(nextButton);
    
    // Should move to next tab
    await waitFor(() => {
      expect(screen.getByText('Показатель (Метрика)')).toBeInTheDocument();
    });
  });

  // More integration tests could be added here
});

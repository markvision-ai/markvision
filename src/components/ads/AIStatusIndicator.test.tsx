
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AIStatusIndicator } from './AIStatusIndicator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Zap: () => <div data-testid="zap-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  WifiOff: () => <div data-testid="wifi-icon" />,
}));

describe('AIStatusIndicator', () => {
  const mockUser = { id: 'test-user-id' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('renders "AI Active" when idle (no active commands)', async () => {
    const activeQ = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const lastQ = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn((fields: string) => (fields === 'id' ? activeQ : lastQ)),
    });

    render(<AIStatusIndicator projectId="test-project" />);

    await waitFor(() => {
      expect(screen.getByText('AI Active')).toBeInTheDocument();
    });
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  it('renders "AI Generating..." when there are pending commands', async () => {
    const activeQ = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: 'cmd-1' }], error: null }),
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => activeQ),
    });

    render(<AIStatusIndicator projectId="test-project" />);

    await waitFor(() => {
      expect(screen.getByText('AI Generating...')).toBeInTheDocument();
    });
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('renders "AI Error" when last command failed', async () => {
    // Mock last command failed
    const lastCommandMock = { status: 'failed', error: 'Test error' };

    const activeQ = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const lastQ = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: lastCommandMock, error: null }),
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn((fields: string) => (fields === 'id' ? activeQ : lastQ)),
    });

    render(<AIStatusIndicator projectId="test-project" />);

    await waitFor(() => {
      expect(screen.getByText('AI Error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });
});

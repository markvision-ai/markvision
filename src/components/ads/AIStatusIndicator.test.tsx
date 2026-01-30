
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
}));

describe('AIStatusIndicator', () => {
  const mockUser = { id: 'test-user-id' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('renders "AI Active" when idle (no active commands)', async () => {
    // Mock no active commands
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
            })
        })
      }),
    });

    (supabase.from as any).mockReturnValue({ select: selectMock });

    render(<AIStatusIndicator />);

    await waitFor(() => {
      expect(screen.getByText('AI Active')).toBeInTheDocument();
    });
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  it('renders "AI Generating..." when there are pending commands', async () => {
    // Mock active commands
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ 
            data: [{ id: 'cmd-1' }], 
            error: null 
          }),
        }),
      }),
    });

    (supabase.from as any).mockReturnValue({ select: selectMock });

    render(<AIStatusIndicator />);

    await waitFor(() => {
      expect(screen.getByText('AI Generating...')).toBeInTheDocument();
    });
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('renders "AI Error" when last command failed', async () => {
    // Mock no active commands
    const activeSelectMock = vi.fn().mockResolvedValue({ data: [], error: null });
    
    // Mock last command failed
    const lastCommandMock = { status: 'failed', error: 'Test error' };
    
    const selectMock = vi.fn();
    
    // Setup chain for active commands check
    selectMock.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })
        })
    });

    // Setup chain for last command check (which is called if active is empty)
    // Note: AIStatusIndicator calls from('ai_commands') twice sequentially.
    // We need to mock the implementation of 'from' to handle calls.
    
    // Let's refine the mock to handle the specific chains based on logic
    (supabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockImplementation((fields) => {
            if (fields === 'id') {
                // Active commands check
                return {
                    eq: vi.fn().mockReturnValue({
                        in: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue({ data: [], error: null })
                        })
                    })
                };
            }
            if (fields === 'status, error') {
                // Last command check
                return {
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: lastCommandMock, error: null })
                            })
                        })
                    })
                };
            }
            return { eq: vi.fn() };
        })
    }));

    render(<AIStatusIndicator />);

    await waitFor(() => {
      expect(screen.getByText('AI Error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreativeCenterTab } from './CreativeCenterTab';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mocks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

vi.mock('@/hooks/useAdAssets', () => ({
  useAdAssets: () => ({
    assets: [],
    loading: false,
    createAsset: vi.fn(),
    deleteAsset: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    }
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('CreativeCenterTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<CreativeCenterTab projectId="test-project" />);
    expect(screen.getByText('AI Анализ')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Например: Онлайн-курс/i)).toBeInTheDocument();
  });

  it('creates command and polls for result', async () => {
    // Setup Supabase mocks
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'cmd-1', status: 'pending' },
          error: null,
        }),
      }),
    });

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn()
          .mockResolvedValueOnce({ // First poll: pending
             data: { id: 'cmd-1', status: 'pending' },
             error: null
          })
          .mockResolvedValueOnce({ // Second poll: completed
             data: { 
               id: 'cmd-1', 
               status: 'completed', 
               result: { 
                 headlines: ['Test Headline'],
                 descriptions: ['Test Desc'],
                 primaryText: 'Test Primary',
                 hashtags: ['#test']
               } 
             },
             error: null
          })
      })
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'ai_commands') {
        return {
          insert: insertMock,
          select: selectMock,
        };
      }
      return { select: vi.fn() };
    });

    render(<CreativeCenterTab projectId="test-project" />);

    // Type in description
    const textarea = screen.getByPlaceholderText(/Например: Онлайн-курс/i);
    fireEvent.change(textarea, { target: { value: 'Test product' } });

    // Click generate button
    const generateBtn = screen.getByText(/Сгенерировать для Facebook/i);
    fireEvent.click(generateBtn);

    // Verify initial command creation
    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        type: 'generate_creative',
        status: 'pending',
        user_id: 'test-user-id',
        payload: {
          productDescription: 'Test product',
          language: 'ru'
        }
      }));
    });

    // Verify polling and result update
    await waitFor(() => {
      expect(screen.getByText('Test Headline')).toBeInTheDocument();
    }, { timeout: 4000 }); // Polling interval is 2s, give it a bit more
    
    expect(screen.getByText('Test Primary')).toBeInTheDocument();
  });

  it('handles generation error', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'cmd-2', status: 'pending' },
          error: null,
        }),
      }),
    });

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn()
          .mockResolvedValue({ 
             data: { 
               id: 'cmd-2', 
               status: 'failed', 
               error: 'Generation failed'
             },
             error: null
          })
      })
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'ai_commands') {
        return {
          insert: insertMock,
          select: selectMock,
        };
      }
      return { select: vi.fn() };
    });

    render(<CreativeCenterTab projectId="test-project" />);

    const textarea = screen.getByPlaceholderText(/Например: Онлайн-курс/i);
    fireEvent.change(textarea, { target: { value: 'Test product error' } });

    const generateBtn = screen.getByText(/Сгенерировать для Facebook/i);
    fireEvent.click(generateBtn);

    // Wait for error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Generation failed');
    });
  });
});

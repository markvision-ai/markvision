
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LeadCard } from './LeadCard';
import { Lead } from '@/hooks/useLeads';
import { subMinutes } from 'date-fns';

// Mock dependencies
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  CSS: {
    Translate: {
      toString: vi.fn(),
    },
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Phone: () => <div data-testid="icon-phone" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  Clock: () => <div data-testid="icon-clock" />,
  AlertTriangle: () => <div data-testid="icon-alert" />,
  // Add other icons as needed for basic rendering, but these are key for the test
  GripVertical: () => <div />,
  Sparkles: () => <div />,
  MessageCircle: () => <div />,
  Globe: () => <div />,
  Crown: () => <div />,
  Flame: () => <div />,
  Zap: () => <div />,
  TrendingUp: () => <div />,
  Gem: () => <div />,
  BoltIcon: () => <div />,
  Instagram: () => <div />,
  DollarSign: () => <div />,
  Brain: () => <div />,
  Snowflake: () => <div />,
  ThermometerSun: () => <div />,
  Image: () => <div />,
  ExternalLink: () => <div />,
}));

describe('LeadCard', () => {
  const mockLead: Lead = {
    id: 'test-lead-1',
    project_id: 'test-project',
    external_lead_id: null,
    name: 'Test Lead',
    email: 'test@example.com',
    phone: '+1234567890',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'test-campaign',
    utm_content: null,
    utm_term: null,
    status: 'new',
    deal_amount: 1000,
    ltv: 0,
    client_id: null,
    visit_id: null,
    extra_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: null,
    assigned_at: null,
    appointment_date: null,
    rejection_reason: null,
    lead_score: 50,
    score_label: null,
  };

  // Removed fake timers to avoid potential date-fns conflicts in simple integration test
  // beforeEach(() => {
  //   vi.useFakeTimers();
  // });

  // afterEach(() => {
  //   vi.useRealTimers();
  // });

  it('renders correctly', () => {
    render(<LeadCard lead={mockLead} />);
    expect(screen.getByText('Test Lead')).toBeInTheDocument();
  });

  it('shows SLA alert when lead is "new" and waiting > 15 mins', async () => {
    const oldDate = subMinutes(new Date(), 20).toISOString();
    const overdueLead = { ...mockLead, status: 'new', created_at: oldDate, updated_at: oldDate };

    render(<LeadCard lead={overdueLead} />);

    // Fast-forward timers to trigger useEffect checkSLA
    // The check runs immediately on mount, but let's be safe
    // Note: useEffect runs after render.
    
    // Check for the "Ожидает" text
    // We expect "Ожидает 20 мин" roughly.
    expect(await screen.findByText(/Ожидает/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
    
    // Ensure the banner (AlertTriangle) is NOT present (replaced by badge)
    expect(screen.queryByText(/Требует внимания!/i)).not.toBeInTheDocument();
  });

  it('does not show SLA alert for recent leads', () => {
    const recentDate = subMinutes(new Date(), 5).toISOString();
    const recentLead = { ...mockLead, status: 'new', created_at: recentDate, updated_at: recentDate };

    render(<LeadCard lead={recentLead} />);

    expect(screen.queryByText(/Ожидает/i)).not.toBeInTheDocument();
  });
});

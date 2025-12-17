import CyberpunkDashboard from '@/components/CyberpunkDashboard';

const Index = () => {
  // Mock data for demonstration
  const dashboardData = {
    totalSpend: 250000,
    impressions: 1500000,
    leads: 450,
    diagnosticsCount: 120,
    salesCount: 35,
    totalRevenue: 875000,
  };

  return <CyberpunkDashboard {...dashboardData} />;
};

export default Index;

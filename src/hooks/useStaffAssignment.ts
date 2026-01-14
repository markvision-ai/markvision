import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaffMember {
  id: string;
  name: string;
  status: string | null;
  email: string | null;
}

export const useStaffForAssignment = (projectId: string | null) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!projectId) {
        setStaff([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name, status, email')
          .eq('project_id', projectId);

        if (error) throw error;
        setStaff(data || []);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [projectId]);

  // Get online staff for round robin
  const getOnlineStaff = () => {
    return staff.filter(s => s.status === 'online' || s.status === 'active');
  };

  // Get random online staff member (Round Robin)
  const getRandomOnlineStaff = (): StaffMember | null => {
    const onlineStaff = getOnlineStaff();
    if (onlineStaff.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * onlineStaff.length);
    return onlineStaff[randomIndex];
  };

  // Assign lead to staff
  const assignLeadToStaff = async (leadId: string, staffId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          assigned_to: staffId,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning lead:', error);
      return false;
    }
  };

  return {
    staff,
    loading,
    getOnlineStaff,
    getRandomOnlineStaff,
    assignLeadToStaff,
  };
};

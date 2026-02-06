// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { ContentItem, ContentStatus } from './useContentFactory';
import { toast } from 'sonner';

export interface ProductionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
  itemId?: string;
}

interface UseProductionLineProps {
  items: ContentItem[];
  updateContent: (id: string, updates: Partial<ContentItem>) => Promise<any>;
}

export const useProductionLine = ({ items, updateContent }: UseProductionLineProps) => {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [activeProcessors, setActiveProcessors] = useState<Record<string, boolean>>({});
  const processingRef = useRef<Record<string, boolean>>({}); // To prevent double processing

  const addLog = useCallback((message: string, level: ProductionLog['level'] = 'info', source: string = 'System', itemId?: string) => {
    const newLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      source,
      itemId
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  }, []);

  // --- Core Processing Logic (The "Engine") ---
  
  const processItem = useCallback(async (item: ContentItem, lineId: string, fieldStatus: string) => {
    const processKey = `${item.id}-${lineId}`;
    
    // Prevent double processing
    if (processingRef.current[processKey]) return;
    processingRef.current[processKey] = true;

    addLog(`Initializing ${lineId} sequence for item #${item.id.slice(0, 4)}...`, 'info', lineId, item.id);
    setActiveProcessors(prev => ({ ...prev, [processKey]: true }));

    // Simulate Processing Delay (2-5 seconds)
    const delay = Math.random() * 3000 + 2000;
    
    setTimeout(async () => {
      try {
        // 10% Chance of Failure (to demonstrate error handling)
        const shouldFail = Math.random() < 0.1;

        if (shouldFail) {
          addLog(`Process failed: ${lineId} unit encountered an exception.`, 'error', lineId, item.id);
          await updateContent(item.id, { [fieldStatus]: 'failed' });
          toast.error(`Production Error: ${lineId} failed for ${item.title}`);
        } else {
          addLog(`Process completed: ${lineId} finished successfully.`, 'success', lineId, item.id);
          
          // Generate mock result URL based on line
          const resultUpdates: any = { [fieldStatus]: 'completed' };
          
          // If all lines are done, move main status? 
          // For now, we just update the specific line status.
          // Logic to advance main status could go here.
          
          await updateContent(item.id, resultUpdates);
          toast.success(`${lineId} completed for ${item.title}`);
        }
      } catch (error) {
        addLog(`Critical System Error: ${error}`, 'error', 'System');
      } finally {
        processingRef.current[processKey] = false;
        setActiveProcessors(prev => {
          const next = { ...prev };
          delete next[processKey];
          return next;
        });
      }
    }, delay);

  }, [updateContent, addLog]);

  // --- Watcher Loop ---
  // Scans for items in 'processing' state and triggers the engine
  useEffect(() => {
    items.forEach(item => {
      // Define lines and their corresponding status fields
      const lines = [
        { id: 'avatar', field: 'heygen_status' },
        { id: 'sora', field: 'sora_status' },
        { id: 'design', field: 'design_status' },
        { id: 'threads', field: 'threads_status' },
        { id: 'telegram', field: 'telegram_status' },
        { id: 'seo', field: 'seo_status' }
      ];

      lines.forEach(line => {
        // Dynamic access to status
        const currentStatus = item[line.field as keyof ContentItem] as string;
        
        if (currentStatus === 'processing' && !processingRef.current[`${item.id}-${line.id}`]) {
          processItem(item, line.id, line.field);
        }
      });
    });
  }, [items, processItem]);

  // --- Auto-Promotion Logic (Restored Data Chains) ---
  useEffect(() => {
    items.forEach(item => {
      // Logic: Promote status based on completed sub-tasks
      // Prevent infinite loops by checking current status first
      
      // Chain 1: Voice -> Avatar
      if (item.status === 'voice_ready' && item.heygen_status === 'completed') {
         addLog(`Chain Event: Promoting #${item.id.slice(0,4)} to Avatar Ready`, 'success', 'Logic');
         updateContent(item.id, { status: 'avatar_ready' });
      }

      // Chain 2: Avatar -> Editing (Waiting for Sora/Design)
      if (item.status === 'avatar_ready' && 
          (item.sora_status === 'completed' || item.sora_status === 'idle') && 
          (item.design_status === 'completed' || item.design_status === 'idle')) {
         
         // Only promote if at least one was actually completed (not just both idle)
         if (item.sora_status === 'completed' || item.design_status === 'completed') {
            addLog(`Chain Event: Promoting #${item.id.slice(0,4)} to Editing Ready`, 'success', 'Logic');
            updateContent(item.id, { status: 'editing_ready' });
         }
      }

      // Chain 3: Editing -> Shipping (Waiting for Text/SEO)
      if (item.status === 'editing_ready' && 
          item.telegram_status === 'completed' && 
          item.threads_status === 'completed') {
         addLog(`Chain Event: Item #${item.id.slice(0,4)} transferred to Shipping Dock`, 'success', 'Logic');
         updateContent(item.id, { status: 'ready_to_send' });
      }
    });
  }, [items, updateContent, addLog]);

  // --- Manual Actions ---
  const retryLine = async (itemId: string, lineId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const fieldMap: Record<string, string> = {
      'avatar': 'heygen_status',
      'sora': 'sora_status',
      'design': 'design_status',
      'threads': 'threads_status',
      'telegram': 'telegram_status',
      'seo': 'seo_status'
    };

    const field = fieldMap[lineId];
    if (field) {
      addLog(`Manual Retry initiated for ${lineId}`, 'warning', 'User', itemId);
      await updateContent(itemId, { [field]: 'processing' });
    }
  };

  const forceComplete = async (itemId: string, lineId: string) => {
     const fieldMap: Record<string, string> = {
      'avatar': 'heygen_status',
      'sora': 'sora_status',
      'design': 'design_status',
      'threads': 'threads_status',
      'telegram': 'telegram_status',
      'seo': 'seo_status'
    };
    const field = fieldMap[lineId];
    if (field) {
       addLog(`Force Complete override for ${lineId}`, 'warning', 'Admin', itemId);
       await updateContent(itemId, { [field]: 'completed' });
    }
  }

  return {
    logs,
    activeProcessors,
    retryLine,
    forceComplete
  };
};

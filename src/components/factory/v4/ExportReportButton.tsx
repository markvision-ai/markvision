import React from 'react';
import { useFactoryStore } from './store';
import { Button } from '@/components/ui/button';
import { FileBarChart } from 'lucide-react';

export const ExportReportButton = () => {
  const { productionLines, postingQueue, scripts } = useFactoryStore();

  const handleExport = () => {
    const headers = ['Section','Name','Status','Progress','ETA_s','Extra'];
    const rows: string[][] = [headers];

    // Scripts
    scripts.forEach(s => {
      rows.push(['Scripts', s.title, s.status, '', '', '']);
    });

    // Production lines
    Object.values(productionLines).forEach(l => {
      rows.push(['Production', l.type, l.status, String(l.progress || 0), String(Math.ceil((l.durationMs || 0)/1000)), '']);
    });

    // Posting
    postingQueue.forEach(p => {
      rows.push(['Posting', p.channel, p.status, '', '', p.link || '']);
    });

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content_center_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      <FileBarChart className="w-4 h-4" />
      Экспорт отчёта
    </Button>
  );
};

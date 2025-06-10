'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ContributorStats {
  user: string;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  reviews: number;
}

interface StatsData {
  org: string;
  since: string;
  includeReviews: boolean;
  excludeForks: boolean;
  blacklist: string[];
  top: number;
  stats: ContributorStats[];
}

interface ExportOptionsProps {
  stats: StatsData;
}

export function ExportOptions({ stats }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const convertToCSV = (data: StatsData) => {
    const headers = [
      'User',
      'Commits',
      'Lines Added',
      'Lines Removed',
      'Reviews',
    ];
    const rows = data.stats.map((stat) => [
      stat.user,
      stat.commits,
      stat.linesAdded,
      stat.linesRemoved,
      stat.reviews,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const csv = convertToCSV(stats);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${stats.org}_stats.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV file downloaded successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    try {
      setIsExporting(true);
      const json = JSON.stringify(stats, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${stats.org}_stats.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('JSON file downloaded successfully');
    } catch (error) {
      toast.error('Failed to export JSON');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      setIsExporting(true);
      const json = JSON.stringify(stats, null, 2);
      await navigator.clipboard.writeText(json);
      toast.success('Stats copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' disabled={isExporting}>
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExportCSV}>
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          Download JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyToClipboard}>
          Copy to Clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TokenDialog } from './TokenDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { StatsCharts } from './StatsCharts';
import { ExportOptions } from './ExportOptions';
import { useKeyboardShortcuts } from './keyboard-shortcuts';

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
  warning?: string;
}

interface ApiResponse {
  message?: string;
  data?: StatsData;
  error?: string;
  warning?: string;
}

export default function StatsForm() {
  const [org, setOrg] = useState('');
  const [since, setSince] = useState('0s');
  const [includeReviews, setIncludeReviews] = useState(false);
  const [excludeForks, setExcludeForks] = useState(false);
  const [blacklist, setBlacklist] = useState('');
  const [top, setTop] = useState(3);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleTokenChange = (newToken: string | null) => {
    setToken(newToken || '');
    if (newToken) {
      localStorage.setItem('github_token', newToken);
      toast.success('GitHub token saved successfully');
    } else {
      localStorage.removeItem('github_token');
      toast.success('GitHub token removed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org,
          since,
          includeReviews,
          excludeForks,
          blacklist,
          top,
          token,
        }),
      });
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      if (data.data) {
        setStats(data.data);
        if (data.warning) {
          setWarning(data.warning);
          toast.warning(data.warning);
        } else {
          toast.success('Stats fetched successfully');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch stats';
      setError(errorMessage);
      setStats(null);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchStats = () => {
    if (!org) {
      toast.error('Organization name is required');
      return;
    }
    const formEvent = new Event('submit', { bubbles: true, cancelable: true });
    handleSubmit(formEvent as unknown as React.FormEvent<HTMLFormElement>);
  };

  const handleExportCSV = () => {
    if (!stats) return;
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
  };

  const handleExportJSON = () => {
    if (!stats) return;
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
  };

  const handleCopyToClipboard = async () => {
    if (!stats) return;
    try {
      const json = JSON.stringify(stats, null, 2);
      await navigator.clipboard.writeText(json);
      toast.success('Stats copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

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

  useKeyboardShortcuts({
    onFetchStats: handleFetchStats,
    onExportCSV: handleExportCSV,
    onExportJSON: handleExportJSON,
    onCopyToClipboard: handleCopyToClipboard,
  });

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Organization Settings</h2>
        <TokenDialog onTokenChange={handleTokenChange} currentToken={token} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GitHub Organization Stats</CardTitle>
          <CardDescription>
            Enter the organization details to fetch contributor statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Organization Name</label>
                <input
                  type='text'
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md'
                  required
                  placeholder='e.g., microsoft'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Since</label>
                <input
                  type='text'
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md'
                  placeholder='e.g., 1y, 6mo, 30d'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  Blacklist (comma-separated)
                </label>
                <input
                  type='text'
                  value={blacklist}
                  onChange={(e) => setBlacklist(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md'
                  placeholder='e.g., user:bot, repo:test'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Top Users</label>
                <input
                  type='number'
                  value={top}
                  onChange={(e) => setTop(Number(e.target.value))}
                  className='w-full px-3 py-2 border rounded-md'
                  min='1'
                />
              </div>
            </div>

            <div className='flex flex-col md:flex-row gap-4'>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={includeReviews}
                  onChange={(e) => setIncludeReviews(e.target.checked)}
                  className='rounded border-gray-300'
                />
                <span className='text-sm'>Include PR Reviews</span>
              </label>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={excludeForks}
                  onChange={(e) => setExcludeForks(e.target.checked)}
                  className='rounded border-gray-300'
                />
                <span className='text-sm'>Exclude Forks</span>
              </label>
            </div>

            <button
              type='submit'
              className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
              disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Stats'}
            </button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warning && (
        <Alert>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Loading Stats...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </div>
          </CardContent>
        </Card>
      )}

      {stats && Array.isArray(stats.stats) && stats.stats.length > 0 && (
        <>
          <div className='flex justify-end mb-4'>
            <ExportOptions stats={stats} />
          </div>
          <StatsCharts stats={stats.stats} org={stats.org} />
          <Card className='mt-6'>
            <CardHeader>
              <CardTitle>Contributor Statistics</CardTitle>
              <CardDescription>
                Top {stats.top} contributors for {stats.org}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Commits</TableHead>
                    <TableHead>Lines Added</TableHead>
                    <TableHead>Lines Removed</TableHead>
                    <TableHead>Reviews</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.stats.map((stat) => (
                    <TableRow key={stat.user}>
                      <TableCell className='font-medium'>{stat.user}</TableCell>
                      <TableCell>{stat.commits}</TableCell>
                      <TableCell>{stat.linesAdded}</TableCell>
                      <TableCell>{stat.linesRemoved}</TableCell>
                      <TableCell>{stat.reviews}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {stats && Array.isArray(stats.stats) && stats.stats.length === 0 && (
        <Alert>
          <AlertDescription>
            No stats found for this organization.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

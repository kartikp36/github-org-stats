'use client';

import { useState } from 'react';

interface StatsData {
  org: string;
  since: string;
  includeReviews: boolean;
  excludeForks: boolean;
  blacklist: string[];
  top: number;
  stats: Array<{
    user: string;
    commits: number;
    linesAdded: number;
    linesRemoved: number;
    reviews: number;
  }>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block mb-1'>Organization Name</label>
          <input
            type='text'
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className='border p-2 w-full'
            required
          />
        </div>
        <div>
          <label className='block mb-1'>Since</label>
          <input
            type='text'
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className='border p-2 w-full'
            placeholder='e.g., 1y, 6mo, 30d'
          />
        </div>
        <div>
          <label className='flex items-center'>
            <input
              type='checkbox'
              checked={includeReviews}
              onChange={(e) => setIncludeReviews(e.target.checked)}
              className='mr-2'
            />
            Include PR Reviews
          </label>
        </div>
        <div>
          <label className='flex items-center'>
            <input
              type='checkbox'
              checked={excludeForks}
              onChange={(e) => setExcludeForks(e.target.checked)}
              className='mr-2'
            />
            Exclude Forks
          </label>
        </div>
        <div>
          <label className='block mb-1'>Blacklist (comma-separated)</label>
          <input
            type='text'
            value={blacklist}
            onChange={(e) => setBlacklist(e.target.value)}
            className='border p-2 w-full'
            placeholder='e.g., user:bot, repo:test'
          />
        </div>
        <div>
          <label className='block mb-1'>Top Users</label>
          <input
            type='number'
            value={top}
            onChange={(e) => setTop(Number(e.target.value))}
            className='border p-2 w-full'
            min='1'
          />
        </div>
        <button
          type='submit'
          className='bg-blue-500 text-white p-2 rounded'
          disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Stats'}
        </button>
      </form>

      {error && (
        <div className='mt-4 p-4 bg-red-100 text-red-700 rounded'>{error}</div>
      )}

      {stats?.warning && (
        <div className='mt-4 p-4 bg-yellow-100 text-yellow-700 rounded'>
          {stats.warning}
        </div>
      )}

      {stats && (
        <div className='mt-8'>
          <h2 className='text-xl font-bold mb-4'>Stats</h2>
          <table className='w-full border-collapse border'>
            <thead>
              <tr>
                <th className='border p-2'>User</th>
                <th className='border p-2'>Commits</th>
                <th className='border p-2'>Lines Added</th>
                <th className='border p-2'>Lines Removed</th>
                <th className='border p-2'>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {stats.stats.map((stat) => (
                <tr key={stat.user}>
                  <td className='border p-2'>{stat.user}</td>
                  <td className='border p-2'>{stat.commits}</td>
                  <td className='border p-2'>{stat.linesAdded}</td>
                  <td className='border p-2'>{stat.linesRemoved}</td>
                  <td className='border p-2'>{stat.reviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

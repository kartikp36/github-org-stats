import { NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';

interface StatsResponse {
  message?: string;
  data?: {
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
  };
  error?: string;
  warning?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { org, since, includeReviews, excludeForks, blacklist, top, token } =
      body;

    if (!org) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const client = new GitHubClient(token);
    const stats = await client.getOrgStats(org, {
      since,
      includeReviews,
      excludeForks,
      blacklist: blacklist
        ? blacklist.split(',').map((s: string) => s.trim())
        : [],
      top: top || 3,
    });

    const response: StatsResponse = {
      data: {
        org,
        since,
        includeReviews,
        excludeForks,
        blacklist: blacklist
          ? blacklist.split(',').map((s: string) => s.trim())
          : [],
        top: top || 3,
        stats,
      },
    };

    if (!token) {
      response.warning =
        'No GitHub token provided. API rate limits may be restricted.';
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error fetching stats:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch stats';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

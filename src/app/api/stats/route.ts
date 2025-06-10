import { NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { org, since, includeReviews, excludeForks, blacklist, top } = body;

    // Validate required fields
    if (!org) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Parse blacklist
    const blacklistArray = blacklist
      ? blacklist.split(',').map((item: string) => item.trim())
      : [];

    const client = new GitHubClient({
      org,
      since,
      includeReviews,
      excludeForks,
      blacklist: blacklistArray,
      top: Number(top) || 3,
    });

    const stats = await client.getStats();

    // Ensure stats is an array
    if (!Array.isArray(stats)) {
      throw new Error('Invalid response from GitHub API');
    }

    return NextResponse.json({
      message: 'Stats fetched successfully',
      data: {
        org,
        since,
        includeReviews,
        excludeForks,
        blacklist: blacklistArray,
        top: Number(top) || 3,
        stats: stats || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch stats',
        warning: !process.env.GITHUB_TOKEN
          ? 'No GitHub token provided. Rate limits may apply.'
          : undefined,
      },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}

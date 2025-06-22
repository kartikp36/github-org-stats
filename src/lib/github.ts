import { Octokit } from '@octokit/rest';

interface StatsOptions {
  since?: string;
  includeReviews?: boolean;
  excludeForks?: boolean;
  blacklist?: string[];
  top?: number;
}

interface ContributorStats {
  user: string;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  reviews: number;
}

export class GitHubClient {
  private octokit: Octokit;
  private hasToken: boolean;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
    this.hasToken = !!token;
  }

  async getOrgStats(
    org: string,
    options: StatsOptions = {}
  ): Promise<ContributorStats[]> {
    const {
      since = '0s',
      includeReviews = false,
      excludeForks = false,
      blacklist = [],
      top = 3,
    } = options;

    try {
      // Get all repositories in the organization
      const repos = await this.octokit.paginate(this.octokit.repos.listForOrg, {
        org,
        type: 'all',
        per_page: 100,
      });

      // Filter out forks if requested
      const filteredRepos = excludeForks
        ? repos.filter((repo) => !repo.fork)
        : repos;

      // Limit the number of repositories to process to prevent timeout
      // For large orgs, we'll focus on the most recently updated repos
      const sortedRepos = filteredRepos
        .sort(
          (a, b) =>
            new Date(b.updated_at || 0).getTime() -
            new Date(a.updated_at || 0).getTime()
        )
        .slice(0, 50); // Limit to 50 most recent repos

      // Get stats for each repository
      const stats: { [key: string]: ContributorStats } = {};

      for (const repo of sortedRepos) {
        // Skip blacklisted repositories
        if (blacklist.some((pattern) => repo.name.includes(pattern))) {
          continue;
        }

        try {
          // Get commits with date filtering and limit
          const commitsOptions: any = {
            owner: org,
            repo: repo.name,
            per_page: 100,
          };

          // Apply date filtering if specified
          if (since !== '0s') {
            const sinceDate = this.parseSinceDate(since);
            if (sinceDate) {
              commitsOptions.since = sinceDate.toISOString();
            }
          }

          // Limit commits to prevent excessive API calls
          const commits = await this.octokit.paginate(
            this.octokit.repos.listCommits,
            commitsOptions,
            (response) => response.data.slice(0, 200) // Limit to 200 commits per repo
          );

          // Process commits in batches to avoid rate limiting
          const batchSize = 10;
          for (let i = 0; i < commits.length; i += batchSize) {
            const batch = commits.slice(i, i + batchSize);

            await Promise.all(
              batch.map(async (commit) => {
                try {
                  const author =
                    commit.author?.login ||
                    commit.commit.author?.name ||
                    'unknown';

                  // Skip blacklisted users
                  if (blacklist.some((pattern) => author.includes(pattern))) {
                    return;
                  }

                  if (!stats[author]) {
                    stats[author] = {
                      user: author,
                      commits: 0,
                      linesAdded: 0,
                      linesRemoved: 0,
                      reviews: 0,
                    };
                  }

                  stats[author].commits++;

                  // Get commit details for lines changed (with error handling)
                  try {
                    const commitDetails = await this.octokit.repos.getCommit({
                      owner: org,
                      repo: repo.name,
                      ref: commit.sha,
                    });

                    if (commitDetails.data.stats) {
                      stats[author].linesAdded +=
                        commitDetails.data.stats.additions || 0;
                      stats[author].linesRemoved +=
                        commitDetails.data.stats.deletions || 0;
                    }
                  } catch (commitError) {
                    // Skip individual commit details if there's an error
                    console.warn(
                      `Failed to get details for commit ${commit.sha}:`,
                      commitError
                    );
                  }
                } catch (error) {
                  console.warn(`Error processing commit:`, error);
                }
              })
            );

            // Add a small delay between batches to avoid rate limiting
            if (i + batchSize < commits.length) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          // Get PR reviews if requested (with limits)
          if (includeReviews) {
            try {
              const pulls = await this.octokit.paginate(
                this.octokit.pulls.list,
                {
                  owner: org,
                  repo: repo.name,
                  state: 'all',
                  per_page: 50, // Reduced per_page
                },
                (response) => response.data.slice(0, 100) // Limit to 100 PRs per repo
              );

              for (const pull of pulls) {
                try {
                  const reviews = await this.octokit.paginate(
                    this.octokit.pulls.listReviews,
                    {
                      owner: org,
                      repo: repo.name,
                      pull_number: pull.number,
                      per_page: 50,
                    },
                    (response) => response.data.slice(0, 50) // Limit reviews per PR
                  );

                  for (const review of reviews) {
                    const reviewer = review.user?.login || 'unknown';

                    // Skip blacklisted users
                    if (
                      blacklist.some((pattern) => reviewer.includes(pattern))
                    ) {
                      continue;
                    }

                    if (!stats[reviewer]) {
                      stats[reviewer] = {
                        user: reviewer,
                        commits: 0,
                        linesAdded: 0,
                        linesRemoved: 0,
                        reviews: 0,
                      };
                    }

                    stats[reviewer].reviews++;
                  }
                } catch (reviewError) {
                  console.warn(
                    `Failed to get reviews for PR ${pull.number}:`,
                    reviewError
                  );
                }
              }
            } catch (pullError) {
              console.warn(
                `Failed to get PRs for repo ${repo.name}:`,
                pullError
              );
            }
          }
        } catch (repoError) {
          console.warn(`Failed to process repo ${repo.name}:`, repoError);
          continue; // Skip this repo and continue with others
        }
      }

      // Convert to array and sort by commits
      const statsArray = Object.values(stats).sort(
        (a, b) => b.commits - a.commits
      );

      // Return top N contributors
      return statsArray.slice(0, top);
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Organization '${org}' not found`);
      }
      throw error;
    }
  }

  private parseSinceDate(since: string): Date | null {
    const now = new Date();
    const match = since.match(/^(\d+)([ymdhs])$/);

    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'y':
        return new Date(now.setFullYear(now.getFullYear() - value));
      case 'm':
        return new Date(now.setMonth(now.getMonth() - value));
      case 'd':
        return new Date(now.setDate(now.getDate() - value));
      case 'h':
        return new Date(now.setHours(now.getHours() - value));
      case 's':
        return new Date(now.setSeconds(now.getSeconds() - value));
      default:
        return null;
    }
  }
}

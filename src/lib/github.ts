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

      // Get stats for each repository
      const stats: { [key: string]: ContributorStats } = {};

      for (const repo of filteredRepos) {
        // Skip blacklisted repositories
        if (blacklist.some((pattern) => repo.name.includes(pattern))) {
          continue;
        }

        // Get commits
        const commits = await this.octokit.paginate(
          this.octokit.repos.listCommits,
          {
            owner: org,
            repo: repo.name,
            per_page: 100,
          }
        );

        // Process commits
        for (const commit of commits) {
          const author =
            commit.author?.login || commit.commit.author?.name || 'unknown';

          // Skip blacklisted users
          if (blacklist.some((pattern) => author.includes(pattern))) {
            continue;
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

          // Get commit details for lines changed
          const commitDetails = await this.octokit.repos.getCommit({
            owner: org,
            repo: repo.name,
            ref: commit.sha,
          });

          if (commitDetails.data.stats) {
            stats[author].linesAdded += commitDetails.data.stats.additions || 0;
            stats[author].linesRemoved +=
              commitDetails.data.stats.deletions || 0;
          }
        }

        // Get PR reviews if requested
        if (includeReviews) {
          const pulls = await this.octokit.paginate(this.octokit.pulls.list, {
            owner: org,
            repo: repo.name,
            state: 'all',
            per_page: 100,
          });

          for (const pull of pulls) {
            const reviews = await this.octokit.paginate(
              this.octokit.pulls.listReviews,
              {
                owner: org,
                repo: repo.name,
                pull_number: pull.number,
                per_page: 100,
              }
            );

            for (const review of reviews) {
              const reviewer = review.user?.login || 'unknown';

              // Skip blacklisted users
              if (blacklist.some((pattern) => reviewer.includes(pattern))) {
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
          }
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
}

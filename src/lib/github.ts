import { Octokit } from '@octokit/rest';

export interface ContributorStats {
  user: string;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  reviews: number;
}

export interface GitHubConfig {
  token?: string;
  org: string;
  since?: string;
  includeReviews: boolean;
  excludeForks: boolean;
  blacklist: string[];
  top: number;
}

interface WeekStats {
  w?: number;
  a?: number;
  d?: number;
  c?: number;
}

interface ContributorData {
  author: {
    login: string;
  } | null;
  total: number;
  weeks: WeekStats[];
}

export class GitHubClient {
  private octokit: Octokit;
  private config: GitHubConfig;
  private hasToken: boolean;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.hasToken = Boolean(config.token || process.env.GITHUB_TOKEN);

    this.octokit = new Octokit({
      auth: config.token || process.env.GITHUB_TOKEN,
    });
  }

  private isBlacklisted(repo: string, user: string): boolean {
    return this.config.blacklist.some((item) => {
      if (item.startsWith('user:')) {
        return user === item.slice(5);
      }
      if (item.startsWith('repo:')) {
        return repo === item.slice(5);
      }
      return user === item || repo === item;
    });
  }

  private async getRepositories() {
    try {
      const repos = await this.octokit.paginate(this.octokit.repos.listForOrg, {
        org: this.config.org,
        type: 'all',
        per_page: 100,
      });

      return repos.filter((repo) => {
        if (this.config.excludeForks && repo.fork) {
          return false;
        }
        return !this.isBlacklisted(repo.name, '');
      });
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Organization "${this.config.org}" not found`);
      }
      if (error.status === 403 && !this.hasToken) {
        throw new Error(
          'Rate limit exceeded. Please add a GitHub token to increase the limit.'
        );
      }
      throw error;
    }
  }

  private async getContributorStats(repo: string): Promise<ContributorData[]> {
    try {
      const { data } = await this.octokit.repos.getContributorsStats({
        owner: this.config.org,
        repo,
      });

      if (!data) return [];
      return Array.isArray(data) ? (data as ContributorData[]) : [];
    } catch (error: any) {
      if (error.status === 403 && !this.hasToken) {
        console.warn(
          `Rate limit exceeded for ${repo}. Please add a GitHub token to increase the limit.`
        );
        return [];
      }
      console.error(`Error fetching stats for ${repo}:`, error);
      return [];
    }
  }

  private async getPRReviews(user: string) {
    if (!this.config.includeReviews) return 0;

    try {
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `org:${this.config.org} reviewed-by:${user} is:pr`,
        per_page: 1,
      });

      return data.total_count;
    } catch (error: any) {
      if (error.status === 403 && !this.hasToken) {
        console.warn(
          `Rate limit exceeded for PR reviews. Please add a GitHub token to increase the limit.`
        );
        return 0;
      }
      console.error(`Error fetching PR reviews for ${user}:`, error);
      return 0;
    }
  }

  public async getStats(): Promise<ContributorStats[]> {
    try {
      const repos = await this.getRepositories();
      const contributorMap = new Map<string, ContributorStats>();

      for (const repo of repos) {
        const stats = await this.getContributorStats(repo.name);

        for (const stat of stats) {
          if (
            !stat.author ||
            this.isBlacklisted(repo.name, stat.author.login)
          ) {
            continue;
          }

          const existing = contributorMap.get(stat.author.login) || {
            user: stat.author.login,
            commits: 0,
            linesAdded: 0,
            linesRemoved: 0,
            reviews: 0,
          };

          existing.commits += stat.total;
          existing.linesAdded += stat.weeks.reduce(
            (sum: number, week: WeekStats) => sum + (week.a || 0),
            0
          );
          existing.linesRemoved += stat.weeks.reduce(
            (sum: number, week: WeekStats) => sum + (week.d || 0),
            0
          );

          contributorMap.set(stat.author.login, existing);
        }
      }

      // Get PR reviews for each contributor
      if (this.config.includeReviews) {
        for (const [user, stats] of contributorMap) {
          stats.reviews = await this.getPRReviews(user);
        }
      }

      // Convert to array and sort by commits
      const contributors = Array.from(contributorMap.values())
        .sort((a, b) => b.commits - a.commits)
        .slice(0, this.config.top);

      return contributors;
    } catch (error) {
      console.error('Error getting stats:', error);
      return [];
    }
  }
}

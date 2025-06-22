'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ContributorStats {
  user: string;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  reviews: number;
}

interface StatsChartsProps {
  stats: ContributorStats[];
  org: string;
}

export function StatsCharts({ stats, org }: StatsChartsProps) {
  // Color palette for consistency
  const colors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(201, 203, 207, 0.8)',
    'rgba(255, 99, 255, 0.8)',
  ];

  const borderColors = [
    'rgb(54, 162, 235)',
    'rgb(255, 99, 132)',
    'rgb(75, 192, 192)',
    'rgb(255, 159, 64)',
    'rgb(153, 102, 255)',
    'rgb(255, 205, 86)',
    'rgb(201, 203, 207)',
    'rgb(255, 99, 255)',
  ];

  // 1. Commits and Reviews Bar Chart (existing)
  const commitsReviewsData = {
    labels: stats.map((stat) => stat.user),
    datasets: [
      {
        label: 'Commits',
        data: stats.map((stat) => stat.commits),
        backgroundColor: colors[0],
        borderColor: borderColors[0],
        borderWidth: 1,
      },
      {
        label: 'Reviews',
        data: stats.map((stat) => stat.reviews),
        backgroundColor: colors[1],
        borderColor: borderColors[1],
        borderWidth: 1,
      },
    ],
  };

  // 2. Lines Added vs Removed per Person (Stacked Bar Chart)
  const linesPerPersonData = {
    labels: stats.map((stat) => stat.user),
    datasets: [
      {
        label: 'Lines Added',
        data: stats.map((stat) => stat.linesAdded),
        backgroundColor: colors[2],
        borderColor: borderColors[2],
        borderWidth: 1,
      },
      {
        label: 'Lines Removed',
        data: stats.map((stat) => stat.linesRemoved),
        backgroundColor: colors[3],
        borderColor: borderColors[3],
        borderWidth: 1,
      },
    ],
  };

  // 3. Net Lines (Added - Removed) per Person
  const netLinesData = {
    labels: stats.map((stat) => stat.user),
    datasets: [
      {
        label: 'Net Lines (Added - Removed)',
        data: stats.map((stat) => stat.linesAdded - stat.linesRemoved),
        backgroundColor: stats.map((stat) =>
          stat.linesAdded - stat.linesRemoved >= 0 ? colors[2] : colors[1]
        ),
        borderColor: stats.map((stat) =>
          stat.linesAdded - stat.linesRemoved >= 0
            ? borderColors[2]
            : borderColors[1]
        ),
        borderWidth: 1,
      },
    ],
  };

  // 4. Commits Distribution Pie Chart
  const commitsDistributionData = {
    labels: stats.map((stat) => stat.user),
    datasets: [
      {
        data: stats.map((stat) => stat.commits),
        backgroundColor: colors.slice(0, stats.length),
        borderColor: borderColors.slice(0, stats.length),
        borderWidth: 2,
      },
    ],
  };

  // 5. Lines Added Distribution Pie Chart
  const linesAddedDistributionData = {
    labels: stats.map((stat) => stat.user),
    datasets: [
      {
        data: stats.map((stat) => stat.linesAdded),
        backgroundColor: colors.slice(0, stats.length),
        borderColor: borderColors.slice(0, stats.length),
        borderWidth: 2,
      },
    ],
  };

  // 6. Commits vs Lines Added Correlation (Line Chart)
  const commitsVsLinesData = {
    labels: stats.map((stat) => stat.user),
    datasets: [
      {
        label: 'Commits',
        data: stats.map((stat, index) => ({ x: index, y: stat.commits })),
        borderColor: borderColors[0],
        backgroundColor: colors[0],
        yAxisID: 'y',
      },
      {
        label: 'Lines Added (scaled)',
        data: stats.map((stat, index) => ({
          x: index,
          y: Math.round(stat.linesAdded / 100), // Scale down for better visualization
        })),
        borderColor: borderColors[2],
        backgroundColor: colors[2],
        yAxisID: 'y1',
      },
    ],
  };

  // 7. Overall Activity Summary (Doughnut) - Total lines added vs removed
  const totalLinesAdded = stats.reduce((sum, stat) => sum + stat.linesAdded, 0);
  const totalLinesRemoved = stats.reduce(
    (sum, stat) => sum + stat.linesRemoved,
    0
  );

  const overallActivityData = {
    labels: ['Lines Added', 'Lines Removed'],
    datasets: [
      {
        data: [totalLinesAdded, totalLinesRemoved],
        backgroundColor: [colors[2], colors[3]],
        borderColor: [borderColors[2], borderColors[3]],
        borderWidth: 2,
      },
    ],
  };

  // Chart options
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const stackedBarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Contributors',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Commits',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Lines Added (÷100)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className='space-y-6'>
      {/* First row - Overview charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Commits & Reviews Distribution</CardTitle>
            <CardDescription>
              Comparison of commits and reviews by contributor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar data={commitsReviewsData} options={barChartOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Code Changes</CardTitle>
            <CardDescription>
              Total lines added vs removed across all contributors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Doughnut data={overallActivityData} options={pieOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Second row - Lines analysis */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Lines Added vs Removed by Person</CardTitle>
            <CardDescription>
              Detailed breakdown of code changes per contributor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar data={linesPerPersonData} options={stackedBarOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Code Contribution</CardTitle>
            <CardDescription>
              Net lines (added - removed) per contributor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar data={netLinesData} options={barChartOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Third row - Distribution charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Commits Distribution</CardTitle>
            <CardDescription>
              Percentage share of total commits by contributor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Pie data={commitsDistributionData} options={pieOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lines Added Distribution</CardTitle>
            <CardDescription>
              Percentage share of total lines added by contributor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Pie data={linesAddedDistributionData} options={pieOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Fourth row - Correlation analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Correlation</CardTitle>
          <CardDescription>
            Relationship between commits and lines added per contributor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Line data={commitsVsLinesData} options={lineChartOptions} />
        </CardContent>
      </Card>
    </div>
  );
}

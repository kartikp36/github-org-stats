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
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
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
  ArcElement
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
  // Prepare data for the bar chart (commits and reviews)
  const barChartData = {
    labels: stats.map((stat) => stat.user),
    datasets: [
      {
        label: 'Commits',
        data: stats.map((stat) => stat.commits),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
      {
        label: 'Reviews',
        data: stats.map((stat) => stat.reviews),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for the doughnut chart (lines added vs removed)
  const totalLinesAdded = stats.reduce((sum, stat) => sum + stat.linesAdded, 0);
  const totalLinesRemoved = stats.reduce(
    (sum, stat) => sum + stat.linesRemoved,
    0
  );

  const doughnutChartData = {
    labels: ['Lines Added', 'Lines Removed'],
    datasets: [
      {
        data: [totalLinesAdded, totalLinesRemoved],
        backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 159, 64, 0.5)'],
        borderColor: ['rgb(75, 192, 192)', 'rgb(255, 159, 64)'],
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Commits and Reviews by Contributor',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Total Lines Added vs Removed',
      },
    },
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Contribution Overview</CardTitle>
          <CardDescription>
            Commits and reviews distribution for {org}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Bar data={barChartData} options={barChartOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Code Changes</CardTitle>
          <CardDescription>Total lines added and removed</CardDescription>
        </CardHeader>
        <CardContent>
          <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
        </CardContent>
      </Card>
    </div>
  );
}

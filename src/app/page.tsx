import StatsForm from '@/components/StatsForm';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';
import logo from '../../public/assets/github-org-stats-logo.webp';

export default function Home() {
  return (
    <main className='min-h-screen bg-background text-foreground'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center justify-between mb-12'>
            <div className='flex items-center gap-6 flex-1'>
              <div className='relative w-16 h-16'>
                <Image
                  src={logo}
                  alt='GitHub Organization Stats Logo'
                  fill
                  className='object-contain'
                  priority
                />
              </div>
              <div>
                <h1 className='text-3xl font-bold tracking-tight'>
                  GitHub Organization Stats
                </h1>
                <p className='mt-2 text-muted-foreground'>
                  Analyze contributor statistics for any GitHub organization
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <StatsForm />
        </div>
      </div>
      <Toaster />
    </main>
  );
}

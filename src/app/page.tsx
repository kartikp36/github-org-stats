import StatsForm from '@/components/StatsForm';

export default function Home() {
  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>GitHub Organization Stats</h1>
      <StatsForm />
    </div>
  );
}

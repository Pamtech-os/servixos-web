import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className='space-y-6 p-6'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-72' />
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-32 rounded-xl' />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Skeleton className='h-80 rounded-xl lg:col-span-2' />
        <Skeleton className='h-80 rounded-xl' />
      </div>
    </div>
  );
}

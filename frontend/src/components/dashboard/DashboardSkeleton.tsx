import { Skeleton } from '../ui/Skeleton';
import { Navbar } from '../shared/Navbar';

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 font-sans overflow-x-hidden">
      <Navbar />
      <div className="fixed inset-0 bg-grid-white pointer-events-none opacity-40" />
      
      <main className="relative z-10 pt-32 pb-24 px-6 max-w-[1600px] mx-auto">
        <div className="mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-16 w-96" />
            <Skeleton className="h-6 w-[500px]" />
          </div>
          <Skeleton className="h-14 w-48" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
          <div className="xl:col-span-3 space-y-6">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
          <div className="xl:col-span-6">
            <Skeleton className="h-full w-full min-h-[400px]" />
          </div>
          <div className="xl:col-span-8">
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="xl:col-span-4 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        </div>
      </main>
    </div>
  );
};

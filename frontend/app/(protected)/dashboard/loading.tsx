import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-300">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-24 rounded" />
      
      {/* Hero Header skeleton */}
      <Skeleton className="h-40 w-full rounded-2xl" />

      {/* Stats Cards skeleton */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      {/* Actions skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

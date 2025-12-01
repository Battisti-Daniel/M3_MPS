'use client';

import { ReactNode, useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const initialize = useAuthStore((state) => state.initialize);
  const initializing = useAuthStore((state) => state.initializing);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (initializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-slate-600">
        <div className="w-full max-w-sm space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <span className="animate-pulse text-sm font-medium">Carregando…</span>
      </div>
    );
  }

  return <>{children}</>;
}



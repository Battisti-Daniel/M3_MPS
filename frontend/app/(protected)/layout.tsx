'use client';

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth-store";

// Carregamento dinâmico dos componentes pesados
const AppHeader = dynamic(
  () => import("@/components/layout/AppHeader").then(mod => ({ default: mod.AppHeader })),
  { 
    ssr: false,
    loading: () => <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
  }
);

const AppSidebar = dynamic(
  () => import("@/components/layout/AppSidebar").then(mod => ({ default: mod.AppSidebar })),
  { 
    ssr: false,
    loading: () => <div className="hidden lg:block w-64 bg-white dark:bg-slate-900" />
  }
);

// Loading skeleton para o conteúdo principal
function MainContentSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
      <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/");
    } else {
      setIsReady(true);
    }
  }, [user, router]);

  // Enquanto verifica autenticação, mostra loading mínimo
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <AppSidebar />
        <main 
          id="main-content" 
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-200" 
          tabIndex={-1}
        >
          <div className="space-y-6 max-w-7xl mx-auto">
            <Suspense fallback={<MainContentSkeleton />}>
              {isReady ? children : <MainContentSkeleton />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}



'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Calendar, LogOut, Bell, Moon, Sun, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { logout as logoutRequest } from "@/services/auth-service";
import { fetchNotifications } from "@/services/notification-service";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { useDarkMode } from "@/hooks/use-dark-mode";

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(false);
  const { isDark, toggleDarkMode, mounted } = useDarkMode();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // ignora erros ao encerrar sessão
    } finally {
      logout();
      // Redireciona para home
      router.push("/");
    }
  };

  useEffect(() => {
    async function loadUnreadCount() {
      if (!mountedRef.current) return;
      try {
        const response = await fetchNotifications({ per_page: 1 });
        if (mountedRef.current) {
          setUnreadCount(response.meta.unread_count ?? 0);
        }
      } catch {
        // ignora erros na contagem inicial
      }
    }

    const handler = (event: CustomEvent<number>) => {
      if (typeof event.detail === "number") {
        setUnreadCount(event.detail);
      }
    };

    mountedRef.current = true;

    if (typeof window !== "undefined") {
      window.addEventListener("notifications:updated", handler as EventListener);
    }

    void loadUnreadCount();

    return () => {
      mountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("notifications:updated", handler as EventListener);
      }
    };
  }, []);

  const unreadBadge =
    unreadCount > 0 ? (
      <span 
        className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white"
        aria-label={`${unreadCount} notificações não lidas`}
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    ) : null;

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'DOCTOR':
        return 'Portal do Médico';
      case 'PATIENT':
        return 'Portal do Paciente';
      case 'ADMIN':
        return 'Área Administrativa';
      default:
        return '';
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-4 sm:px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Menu Mobile */}
        <div className="lg:hidden">
          <MobileMenu />
        </div>
        
        {/* Logo e Título */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white"
          aria-label="Ir para o dashboard"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Agenda+"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-base sm:text-lg font-bold tracking-tight block">Agenda+</span>
            {getRoleLabel() && (
              <span className="text-xs text-slate-600 dark:text-slate-400 block">{getRoleLabel()}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            onClick={toggleDarkMode}
            className="p-2 h-10 w-10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
          </Button>
        )}
        
        {/* Notificações */}
        <Link 
          href="/notifications" 
          className="relative"
          aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        >
          <Button 
            variant="ghost" 
            className="p-2 h-10 w-10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
          >
            <Bell className="h-6 w-6" />
          </Button>
          {unreadBadge}
        </Link>

        {/* Avatar do usuário */}
        <Link
          href="/profile"
          className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer"
          aria-label="Ir para o perfil"
          title="Editar perfil"
        >
          {getUserInitials()}
        </Link>

        {/* Botão Sair */}
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="p-2 h-10 w-10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          aria-label="Sair da conta"
        >
          <LogOut className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
}


'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { clsx } from "clsx";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  NotebookText,
  ShieldCheck,
  Bell,
  UserCog,
  Users,
  ScrollText,
  BarChart3,
  ChevronLeft,
} from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { Button } from "@/components/ui/button";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { isOpen, toggle, close } = useSidebarStore();
  const sidebarRef = useRef<HTMLElement>(null);

  // Fechar sidebar ao clicar fora em mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024
      ) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  const links: SidebarLink[] = [];

  // Menu unificado baseado no papel do usuário
  if (user?.role === "ADMIN") {
    // Admin tem menu completo unificado
    links.push(
      { href: "/admin", label: "Resumo", icon: LayoutDashboard },
      { href: "/admin/doctors", label: "Médicos", icon: UserCog },
      { href: "/admin/patients", label: "Pacientes", icon: Users },
      { href: "/admin/users", label: "Usuários", icon: Users },
      { href: "/admin/health-insurances", label: "Convênios", icon: ShieldCheck },
      { href: "/admin/reports", label: "Relatórios", icon: BarChart3 },
      { href: "/admin/audit", label: "Auditoria", icon: ScrollText },
      { href: "/appointments", label: "Consultas", icon: CalendarDays },
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/profile", label: "Meu perfil", icon: NotebookText },
    );
  } else if (user?.role === "DOCTOR") {
    // Menu para médico
    links.push(
      { href: "/doctor/dashboard", label: "Visão geral", icon: LayoutDashboard },
      { href: "/doctor/schedules", label: "Minhas agendas", icon: CalendarClock },
      { href: "/doctor/appointments", label: "Consultas", icon: CalendarDays },
      { href: "/doctor/blocks", label: "Bloqueios", icon: CalendarCheck },
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/profile", label: "Meu perfil", icon: NotebookText },
    );
  } else {
    // Menu para paciente
    links.push(
      { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
      { href: "/appointments", label: "Consultas", icon: CalendarDays },
      { href: "/doctors", label: "Médicos", icon: CalendarCheck },
      { href: "/patient/observations", label: "Histórico clínico", icon: NotebookText },
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/profile", label: "Meu perfil", icon: NotebookText },
    );
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={clsx(
          "hidden lg:flex fixed lg:sticky top-0 left-0 h-screen z-30 flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700",
          "transition-all duration-300 ease-in-out shadow-lg lg:shadow-none",
          isOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        {/* Header do Sidebar - apenas botão toggle */}
        <div className={clsx(
          "flex items-center justify-center border-b border-slate-200 dark:border-slate-700 min-h-[73px] transition-all duration-300 px-4"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 rounded-lg hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            title={isOpen ? "Fechar menu" : "Abrir menu"}
          >
            <ChevronLeft className={clsx(
              "h-4 w-4 text-slate-600 dark:text-slate-300 transition-all duration-300",
              !isOpen && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || 
              (link.href !== "/admin" && link.href !== "/dashboard" && link.href !== "/doctor/dashboard" && 
               pathname?.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  "group relative",
                  active
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                  !isOpen && "lg:justify-center lg:px-2"
                )}
                title={!isOpen ? link.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={clsx(
                    "transition-all duration-300 whitespace-nowrap",
                    isOpen
                      ? "opacity-100 translate-x-0 w-auto"
                      : "opacity-0 lg:opacity-0 w-0 lg:w-0 overflow-hidden"
                  )}
                >
                  {link.label}
                </span>
                {/* Tooltip quando fechado */}
                {!isOpen && (
                  <span className="absolute left-full ml-2 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs z-50 whitespace-nowrap shadow-xl border border-slate-700">
                    {link.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}



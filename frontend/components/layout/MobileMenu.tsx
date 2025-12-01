'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Menu, Calendar, Bell, Stethoscope, Users, TrendingUp, ScrollText, ShieldCheck, LayoutDashboard, CalendarClock, CalendarCheck, NotebookText } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth-store';
import { getRoleLabel } from '@/lib/translations';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // Fechar menu ao mudar de rota
  useEffect(() => {
    setIsOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevenir scroll do body quando menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
      { href: '/appointments', label: 'Consultas', icon: Calendar },
      { href: '/notifications', label: 'Notificações', icon: Bell },
      { href: '/profile', label: 'Meu perfil', icon: NotebookText },
    ];

    if (user?.role === 'PATIENT') {
      baseItems.push({ href: '/doctors', label: 'Médicos', icon: CalendarCheck });
      baseItems.push({ href: '/patient/observations', label: 'Histórico clínico', icon: NotebookText });
    }

    if (user?.role === 'DOCTOR') {
      // Sobrescrever itens para médico
      return [
        { href: '/doctor/dashboard', label: 'Visão geral', icon: LayoutDashboard },
        { href: '/doctor/schedules', label: 'Minhas agendas', icon: CalendarClock },
        { href: '/doctor/appointments', label: 'Consultas', icon: Calendar },
        { href: '/doctor/blocks', label: 'Bloqueios', icon: CalendarCheck },
        { href: '/notifications', label: 'Notificações', icon: Bell },
        { href: '/profile', label: 'Meu perfil', icon: NotebookText },
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        { href: '/admin', label: 'Resumo', icon: Calendar },
        { href: '/admin/doctors', label: 'Médicos', icon: Stethoscope },
        { href: '/admin/patients', label: 'Pacientes', icon: Users },
        { href: '/admin/users', label: 'Todos os usuários', icon: Users },
        { href: '/admin/health-insurances', label: 'Convênios', icon: ShieldCheck },
        { href: '/admin/reports', label: 'Relatórios', icon: TrendingUp },
        { href: '/admin/audit', label: 'Auditoria', icon: ScrollText },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Botão do menu hambúrguer */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Abrir menu de navegação"
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menu lateral */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Menu de navegação"
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header do menu */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 dark:text-white block">Agenda+</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {user?.role === 'ADMIN' ? 'Administração' : user?.role === 'DOCTOR' ? 'Portal do Médico' : 'Portal do Paciente'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Lista de navegação */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && item.href !== '/dashboard' && item.href !== '/doctor/dashboard' && 
                   pathname?.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer do menu */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm">
              <p className="font-medium text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


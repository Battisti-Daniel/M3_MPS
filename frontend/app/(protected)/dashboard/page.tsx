'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Bell,
  Activity,
  TrendingUp,
  CalendarPlus,
  Heart,
  Sparkles,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchAppointments } from "@/services/appointment-service";
import { fetchDoctors } from "@/services/doctor-service";
import { Appointment, Doctor } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  // Redireciona médicos para o dashboard específico
  useEffect(() => {
    if (user && user.role === 'DOCTOR') {
      router.replace('/doctor/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    async function load() {
      try {
        const [appointmentsResponse, doctorsResponse] = await Promise.all([
          fetchAppointments({ per_page: 10 }),
          fetchDoctors({ per_page: 6 }),
        ]);

        setAppointments(appointmentsResponse.data ?? []);
        setDoctors(doctorsResponse.data ?? []);
      } catch (error) {
        handleApiError(error, "Falha ao carregar resumo inicial");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);

  const pastAppointments = appointments
    .filter((apt) => new Date(apt.scheduled_at) < new Date())
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    .slice(0, 3);

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    pending: appointments.filter((a) => a.status === 'PENDING').length,
    cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
  };

  // Hora atual para saudação
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />
      
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              <span className="text-sm font-medium text-blue-100">{getGreeting()}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Olá, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-base sm:text-lg max-w-xl">
              Gerencie suas consultas médicas e cuide da sua saúde com facilidade.
            </p>
          </div>
          
          <Link href="/appointments">
            <Button 
              size="lg" 
              className="bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group border-0"
            >
              <CalendarPlus className="h-5 w-5 mr-2 text-blue-700" />
              <span className="text-blue-700">Nova Consulta</span>
              <ArrowRight className="h-4 w-4 ml-2 text-blue-700 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Estatísticas Cards */}
      <section className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-800 p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 opacity-60" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight">{loading ? '-' : stats.total}</p>
            <p className="text-sm text-blue-100 mt-1 font-medium">Total de Consultas</p>
          </div>
        </div>

        {/* Confirmadas */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800 p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <Activity className="h-4 w-4 opacity-60" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight">{loading ? '-' : stats.confirmed}</p>
            <p className="text-sm text-emerald-100 mt-1 font-medium">Confirmadas</p>
          </div>
        </div>

        {/* Pendentes */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-700 p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock className="h-5 w-5" />
              </div>
              <Bell className="h-4 w-4 opacity-60" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight">{loading ? '-' : stats.pending}</p>
            <p className="text-sm text-amber-100 mt-1 font-medium">Pendentes</p>
          </div>
        </div>

        {/* Canceladas */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-800 p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight">{loading ? '-' : stats.cancelled}</p>
            <p className="text-sm text-slate-200 mt-1 font-medium">Canceladas</p>
          </div>
        </div>
      </section>
      {/* Próximas Consultas e Médicos */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Próximas Consultas */}
        <Card className="lg:col-span-2 shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">Próximas Consultas</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Suas consultas agendadas</CardDescription>
                </div>
              </div>
              <Link 
                href="/appointments"
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group whitespace-nowrap px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                Ver todas
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </CardHeader>
          <div className="space-y-3 p-6">
            {loading ? (
              <>
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Nenhuma consulta agendada</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Agende sua primeira consulta agora</p>
                <Link href="/appointments">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Agendar consulta
                  </Button>
                </Link>
              </div>
            ) : (
              upcomingAppointments.map((appointment, index) => (
                <Link
                  key={appointment.id}
                  href={`/appointments/${appointment.id}`}
                  className="group block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 hover:border-blue-400 hover:shadow-lg dark:hover:border-blue-500 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar/Ícone */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                        {appointment.doctor?.name?.charAt(0) || '?'}
                      </div>
                      {index === 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {appointment.doctor?.name ?? "---"}
                        </p>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(appointment.scheduled_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(appointment.scheduled_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      {appointment.doctor?.specialty && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1.5 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full inline-block">
                          {appointment.doctor.specialty}
                        </p>
                      )}
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Médicos Disponíveis */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">Médicos</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Profissionais disponíveis</CardDescription>
                </div>
              </div>
              <Link 
                href="/doctors"
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group whitespace-nowrap px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                Ver todos
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </CardHeader>
          <div className="p-6 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </>
            ) : doctors.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Stethoscope className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum médico disponível</p>
              </div>
            ) : (
              doctors.slice(0, 4).map((doctor, index) => (
                <Link
                  key={doctor.id}
                  href={`/doctors/${doctor.id}`}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md bg-white dark:bg-slate-800/50 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {doctor.name?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {doctor.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                        {doctor.specialty}
                      </span>
                      <span className="text-xs text-slate-500">CRM {doctor.crm}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Ações Rápidas e Histórico */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Ações Rápidas */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                <CardDescription>Atalhos para as ações mais comuns</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/appointments"
                className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 text-center transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <CalendarPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Agendar Consulta</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Marque um horário</span>
              </Link>
              <Link
                href="/notifications"
                className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 text-center transition-all duration-300 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notificações</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Avisos e lembretes</span>
              </Link>
              <Link
                href="/profile"
                className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 text-center transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Meu Perfil</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Editar dados</span>
              </Link>
              <Link
                href="/doctors"
                className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-5 text-center transition-all duration-300 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Médicos</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ver profissionais</span>
              </Link>
            </div>
          </div>
        </Card>

        {/* Histórico Recente */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <Activity className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Histórico Recente</CardTitle>
                <CardDescription>Suas últimas consultas realizadas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="p-6 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </>
            ) : pastAppointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-1">Sem histórico</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Você ainda não realizou nenhuma consulta</p>
              </div>
            ) : (
              pastAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {appointment.doctor?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                      {appointment.doctor?.name ?? "---"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(appointment.scheduled_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Footer message */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Heart className="h-4 w-4 text-red-400" />
          <span>Cuide da sua saúde. Agende suas consultas regularmente.</span>
        </div>
      </div>
    </div>
  );
}

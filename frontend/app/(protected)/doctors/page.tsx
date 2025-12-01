'use client';

import { useEffect, useMemo, useState } from "react";
import { Award, Briefcase, Calendar, MapPin, Phone, Search, Shield, Star, Stethoscope, User } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchDoctors } from "@/services/doctor-service";
import { Doctor } from "@/types";

// Avatar placeholder com silhueta profissional
function DoctorAvatar({ name, gender }: { name: string; gender?: string }) {
  // Gera uma cor baseada no nome para consistência
  const getColorFromName = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-teal-500 to-teal-600',
      'from-indigo-500 to-indigo-600',
      'from-cyan-500 to-cyan-600',
      'from-emerald-500 to-emerald-600',
      'from-violet-500 to-violet-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const gradientColor = getColorFromName(name);
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`relative h-full w-full bg-gradient-to-br ${gradientColor} flex items-center justify-center overflow-hidden`}>
      {/* Silhueta de pessoa como fundo */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full opacity-20"
        fill="currentColor"
      >
        {/* Cabeça */}
        <circle cx="50" cy="30" r="18" className="text-white" />
        {/* Corpo/Ombros */}
        <ellipse cx="50" cy="85" rx="35" ry="30" className="text-white" />
        {/* Jaleco médico - detalhe */}
        <path
          d="M30 70 L50 55 L70 70 L70 100 L30 100 Z"
          className="text-white opacity-40"
        />
      </svg>
      
      {/* Iniciais sobrepostas */}
      <span className="relative z-10 text-3xl font-bold text-white drop-shadow-lg">
        {initials}
      </span>
      
      {/* Ícone de estetoscópio no canto */}
      <div className="absolute bottom-2 right-2 rounded-full bg-white/20 p-1.5 backdrop-blur-sm">
        <Stethoscope className="h-4 w-4 text-white" />
      </div>
    </div>
  );
}

// Badge de especialidade
function SpecialtyBadge({ specialty }: { specialty: string }) {
  const getSpecialtyColor = (spec: string) => {
    const lowerSpec = spec.toLowerCase();
    if (lowerSpec.includes('cardio')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (lowerSpec.includes('neuro')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (lowerSpec.includes('pediatr')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    if (lowerSpec.includes('dermato')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (lowerSpec.includes('orto')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (lowerSpec.includes('gineco') || lowerSpec.includes('obstet')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    if (lowerSpec.includes('psiq') || lowerSpec.includes('psico')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    if (lowerSpec.includes('oftalmo')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
    if (lowerSpec.includes('clínico') || lowerSpec.includes('geral')) return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getSpecialtyColor(specialty)}`}>
      <Briefcase className="h-3 w-3" />
      {specialty}
    </span>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const filteredDoctors = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return doctors;
    return doctors.filter((doctor) =>
      [doctor.name, doctor.specialty, doctor.crm]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    );
  }, [doctors, search]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchDoctors({ per_page: 50 });
        setDoctors(response.data ?? []);
      } catch (error) {
        handleApiError(error, "Erro ao carregar profissionais");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg dark:from-blue-700 dark:to-indigo-700">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
            <Stethoscope className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profissionais de Saúde</h1>
            <p className="text-blue-100">Encontre os melhores médicos disponíveis na rede Agenda+</p>
          </div>
        </div>
        
        {/* Barra de busca */}
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome, especialidade ou CRM..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 border-0 bg-white pl-12 text-slate-900 shadow-lg placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-white/50 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Contagem de resultados */}
      {!loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <User className="h-4 w-4" />
          <span>
            {filteredDoctors.length} {filteredDoctors.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}
          </span>
        </div>
      )}

      {/* Grid de cards */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState>
            <div className="text-center">
              <Search className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-slate-500 dark:text-slate-400">Nenhum profissional encontrado.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Tente buscar com outros termos.</p>
            </div>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <div 
              key={doctor.id} 
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800"
            >
              {/* Área da foto */}
              <div className="relative h-40 w-full overflow-hidden">
                <DoctorAvatar name={doctor.name} />
                
                {/* Overlay com gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Nome sobreposto na foto */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white drop-shadow-lg">
                    {doctor.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Award className="h-3.5 w-3.5" />
                    <span className="text-sm">CRM {doctor.crm}</span>
                  </div>
                </div>
              </div>

              {/* Conteúdo do card */}
              <div className="p-4 space-y-4">
                {/* Especialidade */}
                <SpecialtyBadge specialty={doctor.specialty} />

                {/* Informações adicionais */}
                <div className="space-y-2">
                  {/* Avaliação fictícia para visual */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">4.0</span>
                  </div>

                  {/* Disponibilidade */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span>Disponível para agendamento</span>
                  </div>
                </div>

                {/* Convênios */}
                {doctor.health_insurances && doctor.health_insurances.length > 0 && (
                  <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Convênios aceitos
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {doctor.health_insurances.slice(0, 3).map((plan) => (
                        <span 
                          key={plan.id}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        >
                          {plan.name}
                        </span>
                      ))}
                      {doctor.health_insurances.length > 3 && (
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          +{doctor.health_insurances.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão de ação */}
                <button className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-[0.98] dark:from-blue-600 dark:to-blue-700">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Agendar Consulta
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



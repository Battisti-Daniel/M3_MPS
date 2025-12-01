'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Search, Plus, Edit, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Modal } from "@/components/ui/modal";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchHealthInsurances } from "@/services/health-insurance-service";
import {
  createDoctor,
  fetchAdminDoctors,
  toggleDoctorStatus,
  updateDoctor,
} from "@/services/admin-doctor-service";
import { Doctor, HealthInsurance } from "@/types";

const doctorSchema = z.object({
  name: z.string().min(3, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  phone: z.string().optional(),
  password: z.string().optional(),
  crm: z.string().min(3, "Informe o CRM"),
  specialty: z.string().min(2, "Informe a especialidade"),
  qualification: z.string().optional(),
  is_active: z.boolean().optional(),
  health_insurance_ids: z.array(z.number()).optional(),
});

type DoctorForm = z.infer<typeof doctorSchema>;

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter] = useState<"all" | "active" | "inactive">("all");
  const [planFilter] = useState<number | "all">("all");
  const [showFormModal, setShowFormModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      is_active: true,
      health_insurance_ids: [],
    },
  });

  const selectedPlans = watch("health_insurance_ids") ?? [];

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [doctorResponse, insuranceResponse] = await Promise.all([
          fetchAdminDoctors({ per_page: 50 }),
          fetchHealthInsurances(),
        ]);

        setDoctors(doctorResponse.data ?? []);
        setHealthInsurances(insuranceResponse);
      } catch (error) {
        handleApiError(error, "Não foi possível carregar médicos");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredDoctors = useMemo(() => {
    const lower = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const active = doctor.user?.is_active ?? doctor.is_active;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      const matchesPlan =
        planFilter === "all" ||
        !!doctor.health_insurances?.some((plan) => plan.id === planFilter);

      if (!lower) {
        return matchesStatus && matchesPlan;
      }

      const matchesName = doctor.name.toLowerCase().includes(lower);
      const matchesEmail = doctor.user?.email?.toLowerCase().includes(lower);
      const matchesCrm = doctor.crm.toLowerCase().includes(lower);
      const matchesSpecialty = doctor.specialty.toLowerCase().includes(lower);

      return matchesStatus && matchesPlan && (matchesName || matchesEmail || matchesCrm || matchesSpecialty);
    });
  }, [doctors, planFilter, search, statusFilter]);

  const togglePlan = (id: number) => {
    const current = new Set(selectedPlans);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    setValue("health_insurance_ids", Array.from(current), { shouldDirty: true });
  };

  const resetForm = () => {
    setEditing(null);
    setShowFormModal(false);
    reset({
      name: "",
      email: "",
      phone: "",
      password: "",
      crm: "",
      specialty: "",
      qualification: "",
      is_active: true,
      health_insurance_ids: [],
    });
  };

  const reloadDoctors = useCallback(async () => {
    const response = await fetchAdminDoctors({ per_page: 100 });
    setDoctors(response.data ?? []);
  }, []);

  const onSubmit = async (values: DoctorForm) => {
    if (!editing && !values.password) {
      setError("password", { type: "manual", message: "Informe uma senha inicial" });
      return;
    }

    setLoadingForm(true);
    try {
      const payload = {
        ...values,
        password: values.password || undefined,
        health_insurance_ids: selectedPlans,
      };

      if (editing) {
        await updateDoctor(editing.id, payload);
        toast.success("Médico atualizado com sucesso");
      } else {
        await createDoctor(payload);
        toast.success("Médico cadastrado com sucesso");
      }

      resetForm();
      await reloadDoctors();
    } catch (error) {
      handleApiError(error, editing ? "Falha ao atualizar médico" : "Falha ao criar médico");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditing(doctor);
    setShowFormModal(true);
    reset({
      name: doctor.name,
      email: doctor.user?.email ?? "",
      phone: doctor.user?.phone ?? "",
      password: "",
      crm: doctor.crm,
      specialty: doctor.specialty,
      qualification: doctor.qualification ?? "",
      is_active: doctor.user?.is_active ?? doctor.is_active,
      health_insurance_ids: doctor.health_insurances?.map((plan) => plan.id) ?? [],
    });
  };

  const handleNewDoctor = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleToggleActive = async (doctor: Doctor) => {
    const active = doctor.user?.is_active ?? doctor.is_active;
    const question = active
      ? "Deseja realmente desativar este médico? Pacientes não poderão agendar novas consultas."
      : "Deseja reativar este médico e liberá-lo para novos agendamentos?";

    if (typeof window !== "undefined" && !window.confirm(question)) {
      return;
    }

    try {
      setLoadingForm(true);
      await toggleDoctorStatus(doctor.id);
      toast.success(active ? "Médico desativado" : "Médico reativado");
      if (editing?.id === doctor.id && !active) {
        // garante que manutenção reflita status atualizado
        resetForm();
      }
      await reloadDoctors();
    } catch (error) {
      handleApiError(error, "Não foi possível alterar o status do médico");
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Resumo', href: '/admin' },
          { label: 'Médicos' },
        ]}
      />
      
      {/* Header */}
      <section className="px-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Gestão de Médicos
        </h1>
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
          Gerencie os perfis médicos do sistema
        </p>
      </section>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <Input
            placeholder="Buscar por nome, CRM ou especialidade..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="flex-1 min-w-0"
          />
        </div>
        <Button
          onClick={handleNewDoctor}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Médico
        </Button>
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full min-w-[640px]" role="table" aria-label="Lista de médicos">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      CRM
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">
                      Especialidade
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">
                      Contato
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 sm:px-6 py-8">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </td>
                    </tr>
                  ) : filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 sm:px-6 py-12">
                        <EmptyState
                          title="Nenhum médico encontrado"
                          description={search ? "Tente ajustar os filtros de busca." : "Comece cadastrando o primeiro médico."}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doctor) => {
                      const active = doctor.user?.is_active ?? doctor.is_active;
                      return (
                        <tr key={doctor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{doctor.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 md:hidden mt-1">
                              {doctor.specialty}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm text-slate-600 dark:text-slate-300">{doctor.crm}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                            <div className="text-sm text-slate-600 dark:text-slate-300">{doctor.specialty}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              {doctor.user?.email || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {doctor.user?.phone || ''}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                active
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {active ? "ativo" : "inativo"}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                onClick={() => handleEdit(doctor)}
                                className="flex items-center gap-1.5 h-8 px-3 text-xs"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleToggleActive(doctor)}
                                disabled={loadingForm}
                                className="flex items-center gap-1.5 h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Desativar</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

      {/* Modal do Formulário */}
      <Modal
        isOpen={showFormModal}
        onClose={resetForm}
        title={editing ? "Editar médico" : "Novo médico"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" required>Nome</Label>
              <Input
                id="name"
                error={!!errors.name}
                errorMessage={errors.name?.message}
                aria-required="true"
                {...register("name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" required>E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                error={!!errors.email}
                errorMessage={errors.email?.message}
                aria-required="true"
                {...register("email")}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                {...register("phone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" required={!editing}>
                {editing ? "Senha (opcional)" : "Senha inicial"}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={editing ? "new-password" : "new-password"}
                error={!!errors.password}
                errorMessage={errors.password?.message}
                aria-required={!editing}
                {...register("password")}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="crm" required>CRM</Label>
              <Input
                id="crm"
                error={!!errors.crm}
                errorMessage={errors.crm?.message}
                aria-required="true"
                {...register("crm")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty" required>Especialidade</Label>
              <Input
                id="specialty"
                error={!!errors.specialty}
                errorMessage={errors.specialty?.message}
                aria-required="true"
                {...register("specialty")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualification">Qualificações</Label>
            <Input
              id="qualification"
              {...register("qualification")}
            />
          </div>
          <div className="space-y-2">
            <Label>Convênios aceitos</Label>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {healthInsurances.map((plan) => {
                const checked = selectedPlans.includes(plan.id);
                return (
                  <label
                    key={plan.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{plan.name}</p>
                      <p className="text-xs text-slate-500">
                        Cobertura: {plan.coverage_percentage ? plan.coverage_percentage + "%" : "N/D"}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlan(plan.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded border-slate-300"
                    />
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register("is_active")} className="h-4 w-4" />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Ativo na plataforma
            </Label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              loading={loadingForm}
              disabled={loadingForm}
              className="flex-1"
            >
              {editing ? "Salvar alterações" : "Cadastrar médico"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={loadingForm}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </AdminLayout>
  );
}



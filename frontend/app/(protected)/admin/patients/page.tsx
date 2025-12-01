'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Modal } from "@/components/ui/modal";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchHealthInsurances } from "@/services/health-insurance-service";
import { createPatient, fetchAdminPatients, togglePatientStatus, updatePatient } from "@/services/admin-patient-service";
import { HealthInsurance, Patient } from "@/types";
import { Edit, Trash2, CheckCircle2 } from "lucide-react";

const patientSchema = z.object({
  name: z.string().min(3, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  phone: z.string().optional(),
  password: z.string().optional(),
  cpf: z.string().min(11, "Informe o CPF"),
  birth_date: z.string().min(1, "Informe a data de nascimento"),
  gender: z.enum(["M", "F", "OTHER"]).optional(),
  address: z.string().optional(),
  health_insurance_id: z.number().optional().nullable(),
  is_active: z.boolean().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

type PlanSelection = Record<
  number,
  {
    selected: boolean;
    policy_number: string;
  }
>;

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [plans, setPlans] = useState<PlanSelection>({});
  const [showFormModal, setShowFormModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      cpf: "",
      birth_date: "",
      gender: undefined,
      address: "",
      health_insurance_id: null,
      is_active: true,
    },
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [patientResponse, insuranceResponse] = await Promise.all([
          fetchAdminPatients({ per_page: 50 }),
          fetchHealthInsurances(),
        ]);

        setPatients(patientResponse.data ?? []);
        setHealthInsurances(insuranceResponse);
      } catch (error) {
        handleApiError(error, "Não foi possível carregar pacientes");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredPatients = useMemo(() => {
    const lower = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const active = patient.user?.is_active ?? true;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      if (!lower) {
        return matchesStatus;
      }

      const matchesName = patient.name.toLowerCase().includes(lower);
      const matchesEmail = patient.user?.email?.toLowerCase().includes(lower);
      const matchesCpf = patient.cpf.toLowerCase().includes(lower);

      return matchesStatus && (matchesName || matchesEmail || matchesCpf);
    });
  }, [patients, search, statusFilter]);

  const resetPlans = (patient?: Patient | null) => {
    if (!patient || !patient.health_insurances) {
      setPlans({});
      return;
    }

    const mapped: PlanSelection = {};
    patient.health_insurances.forEach((plan) => {
      mapped[plan.id] = {
        selected: true,
        policy_number: plan.pivot?.policy_number ?? "",
      };
    });
    setPlans(mapped);
  };

  const resetForm = () => {
    setEditing(null);
    setShowFormModal(false);
    reset({
      name: "",
      email: "",
      phone: "",
      password: "",
      cpf: "",
      birth_date: "",
      gender: undefined,
      address: "",
      health_insurance_id: null,
      is_active: true,
    });
    setPlans({});
  };

  const reloadPatients = useCallback(async () => {
    const response = await fetchAdminPatients({ per_page: 100 });
    setPatients(response.data ?? []);
  }, []);

  const onSubmit = async (values: PatientForm) => {
    if (!editing && !values.password) {
      setError("password", { type: "manual", message: "Informe uma senha inicial" });
      return;
    }

    setLoadingForm(true);
    try {
      const selectedPlans = Object.entries(plans).filter(([, value]) => value.selected);
      const healthInsuranceIds = selectedPlans.map(([id]) => Number(id));
      const policyNumbers = selectedPlans.reduce<Record<number, string | undefined>>((acc, [id, value]) => {
        const policy = value.policy_number?.trim();
        if (policy) {
          acc[Number(id)] = policy;
        }
        return acc;
      }, {});

      const payload = {
        ...values,
        password: values.password || undefined,
        health_insurance_id: values.health_insurance_id || null,
        health_insurance_ids: healthInsuranceIds,
        health_insurance_policy_numbers: policyNumbers,
      };

      if (editing) {
        await updatePatient(editing.id, payload);
        toast.success("Paciente atualizado com sucesso");
      } else {
        await createPatient(payload);
        toast.success("Paciente cadastrado com sucesso");
      }

      resetForm();
      await reloadPatients();
    } catch (error) {
      handleApiError(error, editing ? "Falha ao atualizar paciente" : "Falha ao criar paciente");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditing(patient);
    setShowFormModal(true);
    reset({
      name: patient.name,
      email: patient.user?.email ?? "",
      phone: patient.user?.phone ?? "",
      password: "",
      cpf: patient.cpf,
      birth_date: patient.birth_date ?? "",
      gender: (patient.gender as "M" | "F" | "OTHER" | undefined) ?? undefined,
      address: patient.address ?? "",
      health_insurance_id: patient.health_insurance_id ?? null,
      is_active: patient.user?.is_active ?? true,
    });
    resetPlans(patient);
  };

  const handleNewPatient = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleToggleActive = async (patient: Patient) => {
    const active = patient.user?.is_active ?? true;
    const question = active
      ? "Deseja desativar este paciente? Ele não conseguirá acessar o sistema."
      : "Deseja reativar este paciente?";

    if (typeof window !== "undefined" && !window.confirm(question)) {
      return;
    }

    try {
      setLoadingForm(true);
      await togglePatientStatus(patient.id);
      toast.success(active ? "Paciente desativado" : "Paciente reativado");
      if (editing?.id === patient.id) {
        resetForm();
      }
      await reloadPatients();
    } catch (error) {
      handleApiError(error, "Não foi possível alterar o status");
    } finally {
      setLoadingForm(false);
    }
  };

  const togglePlan = (id: number) => {
    setPlans((prev) => {
      const current = prev[id] ?? { selected: false, policy_number: "" };
      return {
        ...prev,
        [id]: {
          ...current,
          selected: !current.selected,
        },
      };
    });
  };

  const updatePolicyNumber = (id: number, policy: string) => {
    setPlans((prev) => ({
      ...prev,
      [id]: {
        selected: prev[id]?.selected ?? true,
        policy_number: policy,
      },
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Pacientes</h1>
          <p className="text-sm text-slate-600 mt-1">Gerencie os pacientes cadastrados no sistema</p>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Buscar por nome, CPF ou e-mail..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-md"
            />
          </div>
          <Button
            onClick={handleNewPatient}
            className="bg-purple-600 hover:bg-purple-700"
          >
            + Novo Paciente
          </Button>
        </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Convênio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Nasc.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <EmptyState>Nenhum paciente encontrado.</EmptyState>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const active = patient.user?.is_active ?? true;
                  return (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.cpf || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {patient.user?.email || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {patient.user?.phone || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.health_insurance ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {patient.health_insurance.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Particular</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {patient.birth_date
                            ? new Date(patient.birth_date).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {active ? "ativo" : "inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            onClick={() => handleEdit(patient)}
                            className="flex items-center gap-1.5 h-8 px-3 text-xs"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleToggleActive(patient)}
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
        title={editing ? "Editar paciente" : "Novo paciente"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{editing ? "Senha (opcional)" : "Senha inicial"}</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register("cpf")} />
              {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && (
                <p className="text-xs text-red-500">{errors.birth_date.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <select
                id="gender"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("gender")}
              >
                <option value="">Não informado</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" {...register("address")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="health_insurance_id">Convênio Principal (opcional)</Label>
            <select
              id="health_insurance_id"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={watch("health_insurance_id") ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setValue("health_insurance_id", value ? Number(value) : null);
              }}
            >
              <option value="">Nenhum convênio principal</option>
              {healthInsurances.filter(plan => plan.is_active).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} {plan.coverage_percentage ? `(${plan.coverage_percentage}% cobertura)` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Selecione o convênio principal do paciente. Este é o convênio preferencial para agendamentos.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Convênios do paciente</Label>
            <div className="grid gap-3 max-h-48 overflow-y-auto">
              {healthInsurances.map((plan) => {
                const selection = plans[plan.id] ?? { selected: false, policy_number: "" };
                return (
                  <div
                    key={plan.id}
                    className="rounded-md border border-slate-200 p-3 text-sm shadow-sm"
                  >
                    <label className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-800">{plan.name}</p>
                        <p className="text-xs text-slate-500">
                          Cobertura: {plan.coverage_percentage ?? "N/D"}%
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selection.selected}
                        onChange={() => togglePlan(plan.id)}
                        className="h-4 w-4"
                      />
                    </label>
                    {selection.selected && (
                      <div className="mt-2 space-y-1">
                        <Label htmlFor={`policy-${plan.id}`} className="text-xs font-medium">
                          Número da apólice
                        </Label>
                        <Input
                          id={`policy-${plan.id}`}
                          value={selection.policy_number}
                          onChange={(event) => updatePolicyNumber(plan.id, event.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register("is_active")} className="h-4 w-4" />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Perfil ativo
            </Label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loadingForm} className="flex-1">
              {loadingForm ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar paciente"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} disabled={loadingForm}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </AdminLayout>
  );
}



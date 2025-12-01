'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Modal } from "@/components/ui/modal";
import { handleApiError } from "@/lib/handle-api-error";
import { Edit, Trash2, Plus, Search, X } from "lucide-react";
import {
  createHealthInsurance,
  deleteHealthInsurance,
  fetchHealthInsurances,
  fetchHealthInsuranceStatistics,
  updateHealthInsurance,
} from "@/services/health-insurance-service";
import { HealthInsurance } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Informe o nome"),
  description: z.string().optional(),
  coverage_percentage: z
    .union([z.number(), z.string()])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : Number(value)))
    .refine((value) => value === undefined || (!Number.isNaN(value) && value >= 0 && value <= 100), {
      message: 'Cobertura deve estar entre 0 e 100',
    }),
  is_active: z.boolean().default(true),
});

type FormValues = z.input<typeof schema>;

export default function HealthInsurancesPage() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<HealthInsurance | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showFormModal, setShowFormModal] = useState(false);
  const [statistics, setStatistics] = useState<{
    total_beneficiaries: number;
    total_active_insurances: number;
    average_beneficiaries_per_insurance: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_active: true,
    },
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [insuranceData, statsData] = await Promise.all([
          fetchHealthInsurances(),
          fetchHealthInsuranceStatistics(),
        ]);
        setItems(insuranceData);
        setStatistics(statsData);
      } catch (error) {
        handleApiError(error, "Não foi possível carregar os convênios");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const reloadItems = useCallback(async () => {
    const [insuranceData, statsData] = await Promise.all([
      fetchHealthInsurances(),
      fetchHealthInsuranceStatistics(),
    ]);
    setItems(insuranceData);
    setStatistics(statsData);
  }, []);

  const resetForm = () => {
    setEditing(null);
    setShowFormModal(false);
    reset({ name: "", description: "", coverage_percentage: undefined, is_active: true });
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      // Parse os valores usando o schema para obter os valores transformados
      const parsed = schema.parse(values);
      
      if (editing) {
        await updateHealthInsurance(editing.id, {
          name: parsed.name,
          description: parsed.description,
          coverage_percentage: parsed.coverage_percentage,
          is_active: parsed.is_active,
        });
        toast.success("Convênio atualizado");
      } else {
        await createHealthInsurance({
          name: parsed.name,
          description: parsed.description,
          coverage_percentage: parsed.coverage_percentage,
          is_active: parsed.is_active,
        });
        toast.success("Convênio cadastrado");
      }

      await reloadItems();
      resetForm();
    } catch (error) {
      handleApiError(
        error,
        editing ? "Não foi possível atualizar o convênio" : "Não foi possível criar o convênio",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: HealthInsurance) => {
    setEditing(item);
    setShowFormModal(true);
    reset({
      id: item.id,
      name: item.name,
      description: item.description || "",
      coverage_percentage: item.coverage_percentage ? Number(item.coverage_percentage) : undefined,
      is_active: item.is_active,
    });
  };

  const handleNewInsurance = () => {
    resetForm();
    setShowFormModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleToggleActive = async (item: HealthInsurance) => {
    const question = item.is_active
      ? "Desativar este convênio? Médicos e pacientes deixarão de vinculá-lo."
      : "Reativar este convênio para uso nas agendas?";
    if (typeof window !== "undefined" && !window.confirm(question)) {
      return;
    }

    try {
      await updateHealthInsurance(item.id, { is_active: !item.is_active });
      await reloadItems();
      toast.success("Status atualizado");
    } catch (error) {
      handleApiError(error, "Não foi possível atualizar status");
    }
  };

  const handleDelete = async (item: HealthInsurance) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remover o convênio ${item.name}? Esta operação não poderá ser desfeita.`)
    ) {
      return;
    }

    try {
      await deleteHealthInsurance(item.id);
      await reloadItems();
      toast.success("Convênio removido");
      if (editing?.id === item.id) {
        resetForm();
      }
    } catch (error) {
      handleApiError(error, "Não foi possível remover convênio");
    }
  };

  const normalizedFilter = filter.trim().toLowerCase();
  const orderedItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((item) =>
          (statusFilter === "all" ||
            (statusFilter === "active" && item.is_active) ||
            (statusFilter === "inactive" && !item.is_active)) &&
          (normalizedFilter
            ? [
                item.name,
                item.description,
                item.coverage_percentage?.toString() ?? "",
              ]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(normalizedFilter))
            : true)
        ),
    [items, normalizedFilter, statusFilter],
  );

  if (user?.role !== "ADMIN") {
    return <EmptyState>Você não tem permissão para acessar esta página.</EmptyState>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Convênios</h1>
          <p className="text-sm text-slate-600 mt-1">Gerencie os convênios e planos de saúde</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600 mb-1">Convênios Ativos</p>
              <p className="text-3xl font-bold text-slate-900">
                {items.filter(i => i.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600 mb-1">Total de Beneficiários</p>
              <p className="text-3xl font-bold text-slate-900">
                {statistics?.total_beneficiaries ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600 mb-1">Média por Convênio</p>
              <p className="text-3xl font-bold text-slate-900">
                {statistics?.average_beneficiaries_per_insurance 
                  ? Math.round(statistics.average_beneficiaries_per_insurance)
                  : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome, descrição ou cobertura..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="max-w-md"
            />
          </div>
          <Button
            onClick={handleNewInsurance}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Convênio
          </Button>
        </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
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
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Convênio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cobertura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiários</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médicos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Ações</th>
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
              ) : orderedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <EmptyState>Nenhum convênio encontrado.</EmptyState>
                  </td>
                </tr>
              ) : (
                orderedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {item.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {item.coverage_percentage !== null && item.coverage_percentage !== undefined
                          ? `${item.coverage_percentage}%`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.beneficiaries_count ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.doctors_count ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.is_active ? "ativo" : "inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void handleDelete(item);
                          }}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Excluir</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal do Formulário */}
      <Modal
        isOpen={showFormModal}
        onClose={resetForm}
        title={editing ? "Editar convênio" : "Novo convênio"}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" required>Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} placeholder="Descrição do convênio" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverage_percentage">Cobertura (%)</Label>
            <Input
              id="coverage_percentage"
              type="number"
              min={0}
              max={100}
              step={0.1}
              {...register("coverage_percentage")}
              placeholder="Ex: 80"
            />
            {errors.coverage_percentage && <p className="text-xs text-red-500">{errors.coverage_percentage.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register("is_active")} className="h-4 w-4" />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Ativo
            </Label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar convênio"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} disabled={submitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </AdminLayout>
  );
}



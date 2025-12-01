'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import { getRoleLabel, ROLE_LABELS_PLURAL } from "@/lib/translations";
import { exportAdminUsers, fetchAdminUsers, UserSummary } from "@/services/admin-user-service";
import { User } from "@/types";

const filterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["", "ADMIN", "DOCTOR", "PATIENT"]).optional(),
  is_active: z.enum(["", "true", "false"]).optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
});

type FilterForm = z.infer<typeof filterSchema>;

const defaultSummary: UserSummary = {
  total: 0,
  active: 0,
  inactive: 0,
  by_role: { ADMIN: 0, DOCTOR: 0, PATIENT: 0 },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<UserSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FilterForm>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: "",
      role: "",
      is_active: "",
      created_from: "",
      created_to: "",
    },
  });

  const loadUsers = useCallback(async (payload?: FilterForm) => {
    try {
      setLoading(true);
      const response = await fetchAdminUsers(payload);
      setUsers(response.data ?? []);
      setSummary(response.summary ?? defaultSummary);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar os usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const onSubmit = async (values: FilterForm) => {
    const sanitized: FilterForm = {
      search: values.search?.trim() || undefined,
      role: values.role || undefined,
      is_active: values.is_active || undefined,
      created_from: values.created_from || undefined,
      created_to: values.created_to || undefined,
    };

    void loadUsers(sanitized);
  };

  const onExport = async () => {
    const values = watch();
    const params: Record<string, string | undefined> = {
      search: values.search?.trim() || undefined,
      role: values.role || undefined,
      is_active: values.is_active || undefined,
      created_from: values.created_from || undefined,
      created_to: values.created_to || undefined,
    };

    try {
      setExporting(true);
      const blob = await exportAdminUsers(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `usuarios-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Exportação realizada com sucesso");
    } catch (error) {
      handleApiError(error, "Falha ao exportar usuários");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    reset({
      search: "",
      role: "",
      is_active: "",
      created_from: "",
      created_to: "",
    });
    void loadUsers();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Administre todos os perfis cadastrados no sistema.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-6 pt-0 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="search">Busca</Label>
            <div className="flex items-center gap-2">
              <Input id="search" placeholder="Nome, e-mail ou telefone" {...register("search")} />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <select
              id="role"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("role")}
            >
              <option value="">Todos</option>
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Médico</option>
              <option value="PATIENT">Paciente</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="is_active">Status</Label>
            <select
              id="is_active"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("is_active")}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="created_from">Criado a partir de</Label>
            <Input id="created_from" type="date" {...register("created_from")} />
            {errors.created_from && (
              <p className="text-xs text-red-500">{errors.created_from.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="created_to">Criado até</Label>
            <Input id="created_to" type="date" {...register("created_to")} />
            {errors.created_to && <p className="text-xs text-red-500">{errors.created_to.message}</p>}
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Aplicar filtros</Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Limpar
            </Button>
            <Button type="button" variant="secondary" onClick={onExport} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exportando..." : "Exportar CSV"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/60">
          <div className="space-y-1 p-4">
            <p className="text-xs font-semibold uppercase text-blue-700">Total de usuários</p>
            <p className="text-2xl font-bold text-blue-900">{summary.total}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Ativos</p>
            <p className="text-2xl font-bold text-slate-900">{summary.active}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Inativos</p>
            <p className="text-2xl font-bold text-slate-900">{summary.inactive}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Distribuição por perfil</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {["ADMIN", "DOCTOR", "PATIENT"].map((role) => (
                <span key={role} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1">
                  <strong className="mr-1 text-slate-800">{ROLE_LABELS_PLURAL[role] ?? role}:</strong>
                  {summary.by_role[role as keyof typeof summary.by_role] ?? 0}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Resumo dos usuários correspondentes ao filtro.</CardDescription>
        </CardHeader>
        <div className="max-h-[560px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState className="m-6">Nenhum usuário encontrado com os filtros aplicados.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {users.map((user) => (
                <li key={user.id} className="flex flex-col gap-2 px-6 py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {user.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="grid gap-1 text-xs text-slate-600 md:grid-cols-2 lg:grid-cols-3">
                    <p>
                      <span className="font-medium">Telefone:</span> {user.phone ?? "N/D"}
                    </p>
                    <p>
                      <span className="font-medium">Perfil:</span> {getRoleLabel(user.role)}
                    </p>
                    <p>
                      <span className="font-medium">Criado em:</span>{" "}
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "N/D"}
                    </p>
                    {user.role === "DOCTOR" && (
                      <p className="md:col-span-2 lg:col-span-3">
                        <span className="font-medium">Especialidade:</span>{" "}
                        {user.doctor?.specialty ?? "Não informada"}
                      </p>
                    )}
                    {user.role === "PATIENT" && (
                      <p className="md:col-span-2 lg:col-span-3">
                        <span className="font-medium">CPF:</span> {user.patient?.cpf ?? "Não informado"}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}



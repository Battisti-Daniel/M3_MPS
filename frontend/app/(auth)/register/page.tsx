'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerPatient } from "@/services/auth-service";
import { fetchHealthInsurances } from "@/services/health-insurance-service";
import { HealthInsurance } from "@/types";

const schema = z
  .object({
    name: z.string().min(3, "Informe o nome completo"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(8, "Informe o telefone"),
    password: z.string().min(8, "Senha deve ter entre 8 e 20 caracteres").max(20, "Senha deve ter entre 8 e 20 caracteres"),
    confirm_password: z.string(),
    cpf: z.string().min(11, "Informe o CPF"),
    birth_date: z.string(),
    address: z.string().optional(),
    gender: z.enum(["M", "F", "OTHER"]).optional(),
    health_insurance_id: z.number().optional().nullable(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "As senhas não conferem",
    path: ["confirm_password"],
  });

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);

  useEffect(() => {
    async function loadHealthInsurances() {
      try {
        const data = await fetchHealthInsurances();
        setHealthInsurances(data.filter(hi => hi.is_active));
      } catch {
        // Silently fail - the field will just show empty
      }
    }
    loadHealthInsurances();
  }, []);

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    try {
      await registerPatient({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        cpf: values.cpf,
        birth_date: values.birth_date,
        address: values.address,
        gender: values.gender,
        health_insurance_id: values.health_insurance_id || null,
      });
      router.push('/');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setError('email', {
        type: 'manual',
        message: axiosError?.response?.data?.message ?? 'Não foi possível cadastrar',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl space-y-6">
      <CardHeader className="space-y-3 text-center">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Agenda+" width={64} height={64} priority className="h-14 w-14" />
        </div>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>Cadastre-se para agendar suas consultas.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register('phone')} />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirmar senha</Label>
          <Input id="confirm_password" type="password" {...register('confirm_password')} />
          {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" {...register('cpf')} />
          {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data de nascimento</Label>
          <Input id="birth_date" type="date" {...register('birth_date')} />
          {errors.birth_date && <p className="text-xs text-red-500">{errors.birth_date.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" {...register('address')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gênero</Label>
          <select
            id="gender"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('gender')}
          >
            <option value="">Selecionar</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="OTHER">Outro</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="health_insurance_id">Convênio (se houver)</Label>
          <select
            id="health_insurance_id"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={watch("health_insurance_id") ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setValue("health_insurance_id", value ? Number(value) : null);
            }}
          >
            <option value="">Nenhum / Particular</option>
            {healthInsurances.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Criar conta'}
          </Button>
        </div>
      </form>
      <p className="text-sm text-slate-600">
        Já possui conta?{' '}
        <Link className="text-blue-600 hover:underline" href="/">
          Entrar
        </Link>
      </p>
    </Card>
  );
}



'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Stethoscope, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { login } from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';
import { getRedirectPathByRole } from '@/lib/auth-redirect';

const schema = z.object({
  emailOrCrm: z.string().min(1, 'Informe o e-mail ou CRM'),
  password: z.string().min(6, 'Informe a senha'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof schema>;

export default function DoctorLoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      // Tentar como email primeiro, depois como CRM
      const loginData = values.emailOrCrm.includes('@')
        ? { email: values.emailOrCrm, password: values.password }
        : { email: values.emailOrCrm, password: values.password, crm: values.emailOrCrm };

      const result = await login(loginData);
      setAuth(result);
      router.replace(getRedirectPathByRole(result.user));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: { email?: string[] } }>;
      const errorMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.errors?.email?.[0] || 'Credenciais inválidas. Verifique seu e-mail/CRM e senha.';
      setError('emailOrCrm', {
        type: 'manual',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Login do Médico</h1>
        <p className="text-slate-600">Acesse sua conta profissional</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emailOrCrm">E-mail ou CRM</Label>
          <Input
            id="emailOrCrm"
            placeholder="seu@email.com ou CRM"
            {...register('emailOrCrm')}
          />
          {errors.emailOrCrm && (
            <p className="text-xs text-red-500">{errors.emailOrCrm.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            placeholder="Digite sua senha"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              {...register('remember')}
            />
            <Label htmlFor="remember" className="text-sm text-slate-700 cursor-pointer">
              Lembrar-me
            </Label>
          </div>
          <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
            Esqueceu a senha?
          </Link>
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      {/* Back Link */}
      <div className="text-center mt-6">
        <Link href="/" className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Link>
      </div>
    </div>
  );
}


'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Shield, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { login } from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'Informe a senha'),
});

type LoginForm = z.infer<typeof schema>;

export default function AdminLoginPage() {
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
      const result = await login(values);
      setAuth(result);
      // Redireciona para o dashboard administrativo
      router.replace('/admin/doctors');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setError('email', {
        type: 'manual',
        message: axiosError?.response?.data?.message ?? 'Credenciais inválidas',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Área Administrativa</h1>
          <p className="text-slate-600">Acesso restrito para administradores</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail Administrativo</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@agendamais.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
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

          <Button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900"
            disabled={loading}
          >
            {loading ? 'Acessando...' : 'Acessar Sistema'}
          </Button>
        </form>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Stethoscope, User, Shield, Calendar, ArrowLeft } from 'lucide-react';
import { login } from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';
import { getRedirectPathByRole } from '@/lib/auth-redirect';

const patientSchema = z.object({
  email: z.string()
    .min(1, 'Informe o e-mail')
    .email('E-mail inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(20, 'Senha deve ter no máximo 20 caracteres'),
  remember: z.boolean().optional(),
});

const doctorSchema = z.object({
  email: z.string()
    .min(1, 'Informe o e-mail')
    .email('E-mail inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(20, 'Senha deve ter no máximo 20 caracteres'),
  remember: z.boolean().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;
type DoctorForm = z.infer<typeof doctorSchema>;

export default function HomePage() {
  const [loginType, setLoginType] = useState<'doctor' | 'patient' | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const patientForm = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  });

  const doctorForm = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
  });

  const handlePatientSubmit = async (values: PatientForm) => {
    setLoading(true);
    try {
      const result = await login({ email: values.email, password: values.password });
      setAuth(result);
      router.replace(getRedirectPathByRole(result.user));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: { email?: string[] } }>;
      const errorMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.errors?.email?.[0] || 'Credenciais inválidas. Verifique seu e-mail e senha.';
      patientForm.setError('email', {
        type: 'manual',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSubmit = async (values: DoctorForm) => {
    setLoading(true);
    try {
      const result = await login({ email: values.email, password: values.password });
      setAuth(result);
      router.replace(getRedirectPathByRole(result.user));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: { email?: string[] } }>;
      const errorMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.errors?.email?.[0] || 'Credenciais inválidas. Verifique seu e-mail e senha.';
      doctorForm.setError('email', {
        type: 'manual',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loginType === 'patient') {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-12 flex-col">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-10">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-white">Agenda+</h1>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Login do Paciente
            </h2>
            <p className="text-xl text-white/95 leading-relaxed">
              Acesse sua conta e gerencie suas consultas de forma simples e rápida.
            </p>
          </div>
        </div>
        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="space-y-3 text-center mb-8">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Login do Paciente</h1>
              <p className="text-slate-600">Acesse sua conta e gerencie suas consultas</p>
            </div>
            <form onSubmit={patientForm.handleSubmit(handlePatientSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...patientForm.register('email')}
                />
                {patientForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{patientForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <PasswordInput
                  id="password"
                  placeholder="Digite sua senha (8-20 caracteres)"
                  {...patientForm.register('password')}
                />
                {patientForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{patientForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    {...patientForm.register('remember')}
                  />
                  <Label htmlFor="remember" className="text-sm text-slate-700 cursor-pointer">
                    Lembrar-me
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/register/patient" className="block mb-4">
                <Button
                  variant="outline"
                  className="w-full border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600"
                >
                  Criar conta de paciente
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setLoginType(null)}
                className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loginType === 'doctor') {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-12 flex-col">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-10">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-white">Agenda+</h1>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Login do Médico
            </h2>
            <p className="text-xl text-white/95 leading-relaxed">
              Acesse sua conta profissional e gerencie sua agenda de forma eficiente.
            </p>
          </div>
        </div>
        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="space-y-3 text-center mb-8">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Login do Médico</h1>
              <p className="text-slate-600">Acesse sua conta profissional</p>
            </div>
            <form onSubmit={doctorForm.handleSubmit(handleDoctorSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctorEmail">E-mail</Label>
                <Input
                  id="doctorEmail"
                  type="email"
                  placeholder="seu@email.com"
                  {...doctorForm.register('email')}
                />
                {doctorForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{doctorForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorPassword">Senha</Label>
                <PasswordInput
                  id="doctorPassword"
                  placeholder="Digite sua senha (8-20 caracteres)"
                  {...doctorForm.register('password')}
                />
                {doctorForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{doctorForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="doctorRemember"
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    {...doctorForm.register('remember')}
                  />
                  <Label htmlFor="doctorRemember" className="text-sm text-slate-700 cursor-pointer">
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
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setLoginType(null)}
                className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel Esquerdo - Informações */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-12 flex-col">
        {/* Logo e Título */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Agenda+</h1>
          </div>

          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Bem-vindo ao seu sistema de agendamento clínico
          </h2>
          
          <p className="text-xl text-white/95 leading-relaxed">
            Gerencie consultas, organize sua agenda e ofereça o melhor atendimento aos seus pacientes de forma simples e eficiente.
          </p>
        </div>

        {/* Imagem do Médico */}
        <div className="flex-1 flex items-end">
          <Image
            src="/img/login.jpeg"
            alt="Médico com estetoscópio"
            width={600}
            height={800}
            className="w-full h-auto object-contain max-h-[70vh]"
            priority
          />
        </div>
      </div>

      {/* Painel Direito - Acesso */}
      <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Agenda+</h1>
          </div>

          {/* Título de Acesso */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">
              Escolha como deseja acessar
            </h3>
            <p className="text-slate-600">Selecione o tipo de acesso para continuar</p>
          </div>

          {/* Botões de Acesso */}
          <div className="space-y-4 mb-8">
            {/* Botão Médico - Roxo sólido */}
            <Button
              onClick={() => setLoginType('doctor')}
              className="w-full h-auto p-6 bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-4 justify-start shadow-md"
            >
              <Stethoscope className="h-6 w-6 flex-shrink-0 text-white" />
              <div className="text-left">
                <div className="font-bold text-lg">Sou Médico</div>
                <div className="text-sm font-normal text-white/90">
                  Gerenciar consultas e agenda
                </div>
              </div>
            </Button>

            {/* Botão Paciente - Branco com borda roxa clara */}
            <Button
              onClick={() => setLoginType('patient')}
              variant="outline"
              className="w-full h-auto p-6 border-2 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-300 flex items-center space-x-4 justify-start"
            >
              <User className="h-6 w-6 text-purple-400 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-lg text-slate-900">Sou Paciente</div>
                <div className="text-sm font-normal text-slate-600">
                  Agendar e visualizar consultas
                </div>
              </div>
            </Button>
          </div>

          {/* Link de Cadastro */}
          <div className="text-center mb-6">
            <p className="text-slate-600 inline mr-2">Primeira vez aqui?</p>
            <Link href="/register/patient" className="text-purple-600 font-semibold hover:underline">
              Cadastre-se como Paciente
            </Link>
          </div>

          {/* Área Administrativa */}
          <div className="flex justify-center mb-10">
            <Link href="/admin/login" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Área Administrativa</span>
            </Link>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">5.000+</div>
              <div className="text-sm text-slate-600">Médicos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">50.000+</div>
              <div className="text-sm text-slate-600">Pacientes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">98%</div>
              <div className="text-sm text-slate-600">Satisfação</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

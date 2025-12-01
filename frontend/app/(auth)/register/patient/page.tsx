'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, ArrowLeft, ChevronDown, Calendar, Check, X, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { registerPatient, checkAvailability } from '@/services/auth-service';
import { fetchHealthInsurances } from '@/services/health-insurance-service';
import { useAuthStore } from '@/store/auth-store';
import { HealthInsurance } from '@/types';

// ==================== MÁSCARAS E FORMATADORES ====================

const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const unformatCPF = (value: string): string => value.replace(/\D/g, '');
const unformatPhone = (value: string): string => value.replace(/\D/g, '');

// ==================== VALIDAÇÕES ====================

const validateCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
};

const validateAge = (birthDate: string): { valid: boolean; message?: string } => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 18) return { valid: false, message: 'Você deve ter pelo menos 18 anos' };
  if (age > 100) return { valid: false, message: 'Data de nascimento inválida' };
  return { valid: true };
};

const validateFullName = (name: string): { valid: boolean; message?: string } => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return { valid: false, message: 'Informe nome e sobrenome' };
  
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  if (firstName.length < 3) return { valid: false, message: 'Nome deve ter no mínimo 3 caracteres' };
  if (firstName.length > 15) return { valid: false, message: 'Nome deve ter no máximo 15 caracteres' };
  if (lastName.length < 3) return { valid: false, message: 'Sobrenome deve ter no mínimo 3 caracteres' };
  if (lastName.length > 15) return { valid: false, message: 'Sobrenome deve ter no máximo 15 caracteres' };
  
  const nameRegex = /^[A-Za-zÀ-ÿ\s]+$/;
  if (!nameRegex.test(name)) return { valid: false, message: 'Nome deve conter apenas letras' };
  
  return { valid: true };
};

// ==================== SCHEMA ZOD ====================

const schema = z
  .object({
    name: z.string()
      .min(1, 'Informe o nome completo')
      .refine((val) => validateFullName(val).valid, {
        message: 'Nome e sobrenome devem ter entre 3 e 15 caracteres cada',
      }),
    cpf: z.string()
      .min(1, 'Informe o CPF')
      .refine((val) => validateCPF(val), {
        message: 'CPF inválido',
      }),
    birth_date: z.string()
      .min(1, 'Informe a data de nascimento')
      .refine((val) => validateAge(val).valid, {
        message: 'Idade deve estar entre 18 e 100 anos',
      }),
    gender: z.string().min(1, 'Selecione o sexo'),
    phone: z.string()
      .min(1, 'Informe o telefone')
      .refine((val) => {
        const digits = val.replace(/\D/g, '');
        return digits.length === 10 || digits.length === 11;
      }, { message: 'Telefone inválido' }),
    email: z.string()
      .min(1, 'Informe o e-mail')
      .regex(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'E-mail inválido'
      ),
    address: z.string().min(5, 'Informe o endereço completo'),
    city: z.string().min(2, 'Informe a cidade'),
    state: z.string().min(2, 'Selecione a UF'),
    health_insurance_id: z.number().optional().nullable(),
    password: z.string()
      .min(8, 'Mínimo 8 caracteres')
      .max(20, 'Máximo 20 caracteres')
      .regex(/[A-Z]/, 'Deve conter letra maiúscula')
      .regex(/[a-z]/, 'Deve conter letra minúscula')
      .regex(/[0-9]/, 'Deve conter número')
      .regex(/[^A-Za-z0-9]/, 'Deve conter caractere especial'),
    confirm_password: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos',
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'As senhas não conferem',
    path: ['confirm_password'],
  });

type RegisterForm = z.infer<typeof schema>;

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const GENDERS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
];

export default function PatientRegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
    setValue,
    trigger,
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingCPF, setCheckingCPF] = useState(false);

  // Watch password for requirements indicator
  const password = watch('password', '');
  const passwordRequirements = [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Caractere especial (!@#$%...)', met: /[^A-Za-z0-9]/.test(password) },
  ];

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

  // Handlers para máscaras
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue('cpf', formatted, { shouldValidate: false });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted, { shouldValidate: false });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
    setValue('name', value, { shouldValidate: false });
  };

  // Verificação de CPF duplicado
  const handleCPFBlur = async () => {
    const cpfValue = watch('cpf');
    const isValid = await trigger('cpf');
    
    if (isValid && cpfValue) {
      setCheckingCPF(true);
      try {
        const result = await checkAvailability({ cpf: unformatCPF(cpfValue) });
        if (!result.cpf_available) {
          setError('cpf', { type: 'manual', message: 'CPF já cadastrado no sistema' });
        }
      } catch {
        // Silently fail - will be caught on submit
      } finally {
        setCheckingCPF(false);
      }
    }
  };

  // Verificação de email duplicado
  const handleEmailBlur = async () => {
    const emailValue = watch('email');
    const isValid = await trigger('email');
    
    if (isValid && emailValue) {
      setCheckingEmail(true);
      try {
        const result = await checkAvailability({ email: emailValue });
        if (!result.email_available) {
          setError('email', { type: 'manual', message: 'E-mail já cadastrado no sistema' });
        }
      } catch {
        // Silently fail - will be caught on submit
      } finally {
        setCheckingEmail(false);
      }
    }
  };

  // Validação de telefone apenas no blur
  const handlePhoneBlur = () => {
    trigger('phone');
  };

  // Validação de data de nascimento apenas no blur
  const handleBirthDateBlur = () => {
    trigger('birth_date');
  };

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const result = await registerPatient({
        name: values.name,
        email: values.email,
        phone: unformatPhone(values.phone),
        password: values.password,
        cpf: unformatCPF(values.cpf),
        birth_date: values.birth_date,
        address: values.address,
        gender: values.gender as 'M' | 'F' | 'OTHER',
        health_insurance_id: values.health_insurance_id || null,
      });
      
      // Login automático após cadastro
      setAuth({ token: result.token, user: result.user });
      
      // Redirecionar para o dashboard
      router.push('/dashboard');
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
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Cadastro de Paciente</h1>
        <p className="text-slate-600">Crie sua conta para agendar consultas</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                placeholder="João Silva" 
                {...register('name')}
                onChange={handleNameChange}
                maxLength={50}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <div className="relative">
                <Input
                  id="birth_date"
                  type="date"
                  {...register('birth_date')}
                  onBlur={handleBirthDateBlur}
                  className="pr-10"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.birth_date && <p className="text-xs text-red-500">{errors.birth_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                placeholder="(11) 98765-4321" 
                {...register('phone')}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                maxLength={15}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <Input 
                  id="cpf" 
                  placeholder="000.000.000-00" 
                  {...register('cpf')}
                  onChange={handleCPFChange}
                  onBlur={handleCPFBlur}
                  maxLength={14}
                />
                {checkingCPF && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <div className="relative">
                <select
                  id="gender"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  {...register('gender')}
                >
                  <option value="">Selecione</option>
                  {GENDERS.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  {...register('email')} 
                  onBlur={handleEmailBlur}
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* Full Width - Address */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" placeholder="Rua, número, bairro" {...register('address')} />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" placeholder="São Paulo" {...register('city')} />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">UF</Label>
              <div className="relative">
                <select
                  id="state"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  {...register('state')}
                >
                  <option value="">UF</option>
                  {BRAZIL_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
          </div>

          {/* Convênio */}
          <div className="space-y-2">
            <Label htmlFor="health_insurance_id">Convênio (se houver)</Label>
            <div className="relative">
              <select
                id="health_insurance_id"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
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
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Password Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                placeholder="Digite sua senha"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar Senha</Label>
              <PasswordInput
                id="confirm_password"
                placeholder="Repita a senha"
                {...register('confirm_password')}
              />
              {errors.confirm_password && (
                <p className="text-xs text-red-500">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-purple-500" />
              Requisitos da senha:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    req.met ? 'text-green-600' : 'text-slate-500'
                  }`}
                >
                  {req.met ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="acceptTerms"
            className="mt-1 w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            {...register('acceptTerms')}
          />
          <Label htmlFor="acceptTerms" className="text-sm text-slate-700 cursor-pointer">
            Aceito os{' '}
            <Link href="/terms" className="text-purple-600 hover:underline">
              termos de uso
            </Link>{' '}
            e{' '}
            <Link href="/privacy" className="text-purple-600 hover:underline">
              política de privacidade
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={loading}
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </Button>
      </form>

      {/* Already have account */}
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-600">Já tem conta?</p>
        <Link href="/login/patient" className="block">
          <Button variant="outline" className="w-full border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600">
            Fazer login
          </Button>
        </Link>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Link>
      </div>
    </div>
  );
}


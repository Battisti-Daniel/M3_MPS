'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { ChevronDown, Heart, AlertTriangle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { handleApiError } from "@/lib/handle-api-error";
import {
  fetchProfile,
  updateProfile,
  acceptPrivacyPolicy,
  requestDataErasure,
  exportUserData,
} from "@/services/profile-service";
import { fetchHealthInsurances } from "@/services/health-insurance-service";
import { checkAvailability } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { HealthInsurance } from "@/types";

// Funções de formatação
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Validações
const validateFullName = (name: string): { valid: boolean; message?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: "Informe seu nome" };
  }
  
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) {
    return { valid: false, message: "Informe nome e sobrenome" };
  }
  
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  if (!/^[A-Za-zÀ-ÿ\s]+$/.test(name)) {
    return { valid: false, message: "Nome deve conter apenas letras" };
  }
  
  if (firstName.length < 3) {
    return { valid: false, message: "Nome deve ter no mínimo 3 caracteres" };
  }
  if (firstName.length > 15) {
    return { valid: false, message: "Nome deve ter no máximo 15 caracteres" };
  }
  if (lastName.length < 3) {
    return { valid: false, message: "Sobrenome deve ter no mínimo 3 caracteres" };
  }
  if (lastName.length > 15) {
    return { valid: false, message: "Sobrenome deve ter no máximo 15 caracteres" };
  }
  
  return { valid: true };
};

const validateAge = (birthDate: string): { valid: boolean; message?: string } => {
  if (!birthDate) return { valid: true }; // Opcional
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  if (isNaN(birth.getTime())) {
    return { valid: false, message: "Data de nascimento inválida" };
  }
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  if (age < 18) {
    return { valid: false, message: "Você deve ter pelo menos 18 anos" };
  }
  if (age > 100) {
    return { valid: false, message: "Data de nascimento inválida" };
  }
  
  return { valid: true };
};

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password) return { valid: true }; // Opcional
  
  if (password.length < 8) {
    return { valid: false, message: "Senha deve ter no mínimo 8 caracteres" };
  }
  if (password.length > 20) {
    return { valid: false, message: "Senha deve ter no máximo 20 caracteres" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Senha deve conter letra maiúscula" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Senha deve conter letra minúscula" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Senha deve conter número" };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "Senha deve conter caractere especial" };
  }
  
  return { valid: true };
};

const profileSchema = z.object({
  name: z.string()
    .min(1, "Informe seu nome")
    .refine((val) => validateFullName(val).valid, {
      message: "Nome e sobrenome devem ter entre 3 e 15 caracteres cada",
    }),
  email: z.string()
    .min(1, "Informe o e-mail")
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "E-mail inválido"),
  phone: z.string()
    .min(1, "Informe o telefone")
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 10 || digits.length === 11;
    }, "Telefone deve ter 10 ou 11 dígitos"),
  password: z.string()
    .optional()
    .refine((val) => validatePassword(val || '').valid, {
      message: "Senha deve ter 8-20 caracteres, maiúscula, minúscula, número e especial",
    }),
  current_password: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["", "M", "F", "OTHER"]).optional(),
  address: z.string().optional(),
  health_insurance_id: z.number().optional().nullable(),
  specialty: z.string().optional(),
  qualification: z.string().optional(),
  crm: z.string().optional(),
  role: z.string().optional(),
}).refine((data) => {
  // Se password está preenchido, current_password é obrigatório
  if (data.password && !data.current_password) {
    return false;
  }
  return true;
}, {
  message: "Informe a senha atual para alterar a senha",
  path: ["current_password"],
}).refine((data) => {
  // Para pacientes, data de nascimento é obrigatória
  if (data.role === "PATIENT" && !data.birth_date) {
    return false;
  }
  return true;
}, {
  message: "Informe a data de nascimento",
  path: ["birth_date"],
}).refine((data) => {
  // Validar idade se data de nascimento preenchida
  if (data.birth_date) {
    const result = validateAge(data.birth_date);
    return result.valid;
  }
  return true;
}, {
  message: "Idade deve estar entre 18 e 100 anos",
  path: ["birth_date"],
}).refine((data) => {
  // Para pacientes, endereço é obrigatório
  if (data.role === "PATIENT" && (!data.address || data.address.trim().length < 10)) {
    return false;
  }
  return true;
}, {
  message: "Informe o endereço completo (mínimo 10 caracteres)",
  path: ["address"],
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const originalEmailRef = useRef<string>("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      current_password: "",
      birth_date: "",
      gender: "",
      address: "",
      health_insurance_id: null,
      specialty: "",
      qualification: "",
      crm: "",
      role: authUser?.role ?? "",
    },
  });

  // Handler para máscara de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted, { shouldValidate: false });
  };

  // Handler para validação de telefone no blur
  const handlePhoneBlur = () => {
    trigger('phone');
  };

  // Handler para validação de data de nascimento no blur
  const handleBirthDateBlur = () => {
    trigger('birth_date');
  };

  // Handler para verificação de email duplicado
  const handleEmailBlur = async () => {
    const emailValue = watch('email');
    const isValid = await trigger('email');
    
    // Só verifica se é válido e diferente do original
    if (isValid && emailValue && emailValue.toLowerCase() !== originalEmailRef.current.toLowerCase()) {
      setCheckingEmail(true);
      try {
        const result = await checkAvailability({ email: emailValue.toLowerCase() });
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

  // Handler para nome (apenas letras)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
    setValue('name', value, { shouldValidate: false });
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await fetchProfile();
      setUser(profile);
      originalEmailRef.current = profile.email;
      
      // Formatar a data de nascimento para o formato YYYY-MM-DD que o input type="date" espera
      let birthDateFormatted = "";
      if (profile.patient?.birth_date) {
        const date = new Date(profile.patient.birth_date);
        birthDateFormatted = date.toISOString().split('T')[0];
      }
      
      reset({
        name: profile.name,
        email: profile.email,
        phone: profile.phone ? formatPhone(profile.phone) : "",
        password: "",
        current_password: "",
        birth_date: birthDateFormatted,
        gender: (profile.patient?.gender as "M" | "F" | "OTHER" | undefined) ?? undefined,
        address: profile.patient?.address ?? "",
        health_insurance_id: profile.patient?.health_insurance_id ?? null,
        specialty: profile.doctor?.specialty ?? "",
        qualification: profile.doctor?.qualification ?? "",
        crm: profile.doctor?.crm ?? "",
        role: profile.role,
      });
    } catch (error) {
      handleApiError(error, "Não foi possível carregar seu perfil");
    } finally {
      setLoading(false);
    }
  }, [reset, setUser]);

  useEffect(() => {
    void load();
  }, [load]);

  // Carregar convênios antes do perfil para garantir que esteja disponível
  useEffect(() => {
    async function loadHealthInsurances() {
      try {
        const data = await fetchHealthInsurances();
        setHealthInsurances(data.filter(hi => hi.is_active));
      } catch {
        // Silently fail
      }
    }
    loadHealthInsurances();
  }, []);

  const onSubmit = async (values: ProfileForm) => {
    // Verificar se há erro de email duplicado
    if (errors.email) {
      return;
    }

    setSaving(true);
    
    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email.toLowerCase(),
      phone: values.phone?.replace(/\D/g, '') || undefined,
    };

    if (values.password) {
      payload.password = values.password;
      payload.current_password = values.current_password;
    }

    if (authUser?.role === "PATIENT") {
      payload.patient = {
        birth_date: values.birth_date || undefined,
        gender: values.gender || undefined,
        address: values.address || undefined,
        health_insurance_id: values.health_insurance_id || null,
      };
    }

    if (authUser?.role === "DOCTOR") {
      payload.doctor = {
        specialty: values.specialty || undefined,
        qualification: values.qualification || undefined,
        crm: values.crm || undefined,
      };
    }

    try {
      const updated = await updateProfile(payload);
      setUser(updated);
      originalEmailRef.current = values.email.toLowerCase();
      toast.success("Perfil atualizado com sucesso");
      reset({ ...values, password: "", current_password: "" });
    } catch (error) {
      handleApiError(error, "Não foi possível atualizar seu perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptPrivacy = async () => {
    try {
      setPrivacyLoading(true);
      const response = await acceptPrivacyPolicy();
      // Atualiza o usuário no store com os dados retornados
      if (response?.user) {
        setUser(response.user);
        toast.success("Termos de privacidade aceitos com sucesso!");
      } else {
        // Se não veio o usuário, recarrega o perfil
        await load();
        toast.success("Termos de privacidade aceitos.");
      }
    } catch (error) {
      handleApiError(error, "Não foi possível registrar sua aceitação");
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleRequestErasure = async () => {
    setShowDeleteModal(true);
  };

  const confirmDataErasure = async () => {
    try {
      setPrivacyLoading(true);
      setShowDeleteModal(false);
      await requestDataErasure();
      toast.success("Solicitação registrada. Nossa equipe entrará em contato.");
      await load();
    } catch (error) {
      handleApiError(error, "Não foi possível registrar a solicitação");
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meus-dados-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação gerada com sucesso.");
    } catch (error) {
      handleApiError(error, "Não foi possível exportar seus dados");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meu perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais e preferências.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-6 pt-0 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input 
              id="name" 
              placeholder="Nome Sobrenome" 
              {...register("name")}
              onChange={handleNameChange}
              maxLength={50}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                {...register("email")} 
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
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input 
              id="phone" 
              placeholder="(11) 98765-4321"
              {...register("phone")}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              maxLength={15}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="current_password">Senha atual</Label>
            <Input 
              id="current_password" 
              type="password" 
              placeholder="Necessária para alterar senha"
              {...register("current_password")} 
            />
            {errors.current_password && <p className="text-xs text-red-500">{errors.current_password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="8-20 caracteres, maiúsc., minúsc., número, especial"
              {...register("password")} 
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {authUser?.role === "PATIENT" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de nascimento <span className="text-red-500">*</span></Label>
                <Input 
                  id="birth_date" 
                  type="date" 
                  {...register("birth_date")}
                  onBlur={handleBirthDateBlur}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                />
                {errors.birth_date && <p className="text-xs text-red-500">{errors.birth_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <div className="relative">
                  <select
                    id="gender"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    {...register("gender")}
                  >
                    <option value="">Não informar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="OTHER">Outro</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="health_insurance_id">Convênio</Label>
                <div className="relative">
                  <select
                    id="health_insurance_id"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    value={watch("health_insurance_id") ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setValue("health_insurance_id", value ? Number(value) : null, { shouldDirty: true });
                    }}
                  >
                    <option value="">Nenhum / Particular</option>
                    {healthInsurances.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="address" 
                  rows={3} 
                  placeholder="Rua, número, bairro, cidade - CEP" 
                  {...register("address")} 
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>
            </>
          )}

          {authUser?.role === "DOCTOR" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                <Input id="crm" {...register("crm")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input id="specialty" {...register("specialty")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="qualification">Qualificações</Label>
                <Textarea id="qualification" rows={3} {...register("qualification")} />
              </div>
            </>
          )}

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="submit" disabled={!isDirty || saving || checkingEmail}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade e dados</CardTitle>
        </CardHeader>
        <div className="space-y-6 p-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Controle sua aceitação dos termos e solicite a exclusão dos seus dados pessoais.
          </p>
          
          {/* Aceite de termos */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Termos de Privacidade</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {authUser?.privacy_policy_accepted_at
                ? `✓ Termos aceitos em ${new Date(
                    authUser.privacy_policy_accepted_at,
                  ).toLocaleDateString("pt-BR")}.`
                : "Você ainda não aceitou os termos de privacidade vigentes."}
            </p>
            {!authUser?.privacy_policy_accepted_at && (
              <Button
                variant="secondary"
                onClick={handleAcceptPrivacy}
                disabled={privacyLoading}
              >
                {privacyLoading ? "Aceitando..." : "Aceitar termos de privacidade"}
              </Button>
            )}
          </div>

          {/* Exclusão de dados */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              Exclusão de Dados
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {authUser?.data_erasure_requested_at
                ? `Solicitação de exclusão registrada em ${new Date(
                    authUser.data_erasure_requested_at,
                  ).toLocaleDateString("pt-BR")}.`
                : "Caso deseje remover seus dados, solicite a exclusão abaixo."}
            </p>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
              onClick={handleRequestErasure}
              disabled={privacyLoading || !!authUser?.data_erasure_requested_at}
            >
              Solicitar exclusão de dados
            </Button>
          </div>

          {/* Modal de confirmação de exclusão */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title=""
          >
            <div className="text-center py-4">
              {/* Ícone triste */}
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 flex items-center justify-center mb-6">
                <Heart className="h-10 w-10 text-red-500 dark:text-red-400" />
              </div>
              
              {/* Título emotivo */}
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Que pena que você está partindo... 💔
              </h2>
              
              {/* Mensagem */}
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Sentiremos sua falta! Esperamos que sua experiência conosco tenha sido positiva.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Ao confirmar, sua conta será anonimizada e você perderá o acesso permanentemente.
                Esta ação não pode ser desfeita.
              </p>
              
              {/* Aviso */}
              <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 mb-6">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Seus dados serão removidos em até 30 dias úteis</span>
              </div>
              
              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="order-2 sm:order-1"
                >
                  Mudei de ideia, quero ficar! 😊
                </Button>
                <Button
                  onClick={confirmDataErasure}
                  disabled={privacyLoading}
                  className="order-1 sm:order-2 bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
                >
                  {privacyLoading ? "Processando..." : "Confirmar exclusão"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Exportar dados */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Exportar Dados</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Baixe uma cópia dos seus dados pessoais em formato JSON.
            </p>
            <Button variant="outline" onClick={handleExportData} disabled={exporting}>
              {exporting ? "Gerando..." : "Exportar meus dados"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}



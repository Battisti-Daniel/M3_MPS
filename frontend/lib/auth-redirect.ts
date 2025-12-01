import { User } from '@/types';

/**
 * Retorna a rota de redirecionamento baseada no role do usuário
 */
export function getRedirectPathByRole(user: User | null): string {
  if (!user) {
    return '/login/patient';
  }

  switch (user.role) {
    case 'ADMIN':
      return '/admin/doctors'; // Dashboard administrativo
    case 'DOCTOR':
      return '/doctor/dashboard'; // Dashboard do médico
    case 'PATIENT':
      return '/dashboard'; // Dashboard do paciente
    default:
      return '/dashboard';
  }
}


import { useEffect, useState } from 'react';
import { fetchAppointments } from '@/services/appointment-service';
import { Appointment } from '@/types';
import { handleApiError } from '@/lib/handle-api-error';

interface UseAppointmentsOptions {
  per_page?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  autoLoad?: boolean;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

/**
 * Hook customizado para gerenciar consultas
 * Centraliza lógica comum de carregamento e atualização
 */
export function useAppointments(
  options: UseAppointmentsOptions = {}
): UseAppointmentsReturn {
  const { per_page = 20, status, start_date, end_date, autoLoad = true } = options;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAppointments({
        per_page,
        status,
        start_date,
        end_date,
      });
      setAppointments(response.data ?? []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      handleApiError(err, 'Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [per_page, status, start_date, end_date, autoLoad]);

  return {
    appointments,
    loading,
    error,
    reload: loadAppointments,
    setAppointments,
  };
}


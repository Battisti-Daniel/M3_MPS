<?php

namespace App\Application\Appointments;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

/**
 * Serviço responsável pelas validações de consultas
 *
 * Centraliza todas as regras de validação de negócio
 */
class AppointmentValidationService
{
    /**
     * Número máximo de consultas futuras permitidas por paciente
     */
    public const MAX_FUTURE_APPOINTMENTS_PER_PATIENT = 2;

    /**
     * Valida se os perfis estão ativos
     */
    public function ensureProfilesAreActive(Doctor $doctor, Patient $patient): void
    {
        if (! $doctor->is_active || ! $doctor->user?->is_active) {
            throw ValidationException::withMessages([
                'doctor_id' => __('Este médico está inativo e não pode receber novos agendamentos.'),
            ]);
        }

        if (! $patient->user?->is_active) {
            throw ValidationException::withMessages([
                'patient' => __('Sua conta está inativa. Entre em contato com o suporte.'),
            ]);
        }
    }

    /**
     * Valida se o paciente não excedeu o limite de consultas futuras
     */
    public function ensurePatientCanScheduleMore(Patient $patient): void
    {
        $futureAppointmentsCount = Appointment::query()
            ->where('patient_id', $patient->id)
            ->where('scheduled_at', '>', now())
            ->whereIn('status', [
                AppointmentStatus::PENDING,
                AppointmentStatus::CONFIRMED,
            ])
            ->count();

        if ($futureAppointmentsCount >= self::MAX_FUTURE_APPOINTMENTS_PER_PATIENT) {
            throw ValidationException::withMessages([
                'patient' => __(
                    'Você já possui :count consultas futuras agendadas. O limite máximo é de :max consultas por vez. Aguarde uma consulta ser realizada ou cancele uma existente.',
                    [
                        'count' => $futureAppointmentsCount,
                        'max' => self::MAX_FUTURE_APPOINTMENTS_PER_PATIENT,
                    ]
                ),
            ]);
        }
    }

    /**
     * Número máximo de faltas consecutivas antes de bloquear
     */
    public const MAX_CONSECUTIVE_NO_SHOWS = 3;

    /**
     * Valida se o paciente não está bloqueado por faltas
     */
    public function ensurePatientNotBlocked(Patient $patient): void
    {
        if ($patient->is_blocked) {
            throw ValidationException::withMessages([
                'patient' => __(
                    'Sua conta está bloqueada para novos agendamentos devido a :count faltas consecutivas. Entre em contato com a administração para liberação.',
                    ['count' => $patient->consecutive_no_shows]
                ),
            ]);
        }
    }

    /**
     * Conta as faltas consecutivas do paciente (sem consultas completadas ou confirmadas entre elas)
     */
    public function countConsecutiveNoShows(Patient $patient): int
    {
        // Busca as últimas consultas ordenadas por data (mais recente primeiro)
        $recentAppointments = Appointment::query()
            ->where('patient_id', $patient->id)
            ->whereIn('status', [
                AppointmentStatus::NO_SHOW,
                AppointmentStatus::COMPLETED,
            ])
            ->orderByDesc('scheduled_at')
            ->limit(10)
            ->get();

        $consecutiveNoShows = 0;

        foreach ($recentAppointments as $appointment) {
            if ($appointment->status === AppointmentStatus::NO_SHOW) {
                $consecutiveNoShows++;
            } else {
                // Se encontrou uma consulta completada, para de contar
                break;
            }
        }

        return $consecutiveNoShows;
    }

    /**
     * Atualiza o contador de faltas e bloqueia se necessário
     */
    public function updateNoShowCountAndBlock(Patient $patient): void
    {
        $consecutiveNoShows = $this->countConsecutiveNoShows($patient);
        
        $patient->consecutive_no_shows = $consecutiveNoShows;
        
        if ($consecutiveNoShows >= self::MAX_CONSECUTIVE_NO_SHOWS && !$patient->is_blocked) {
            $patient->is_blocked = true;
            $patient->blocked_at = now();
            $patient->blocked_reason = "Bloqueado automaticamente por {$consecutiveNoShows} faltas consecutivas.";
        }
        
        $patient->save();
    }

    /**
     * Valida se o médico permite agendamentos
     */
    public function ensureDoctorAllowsScheduling(Doctor $doctor): void
    {
        $totalSchedules = $doctor->schedules()->count();
        $blockedSchedules = $doctor->schedules()->where('is_blocked', true)->count();
        
        // Se não tem nenhum schedule configurado
        if ($totalSchedules === 0) {
            throw ValidationException::withMessages([
                'doctor_id' => __('O médico não possui agenda configurada. Configure horários de atendimento antes de agendar consultas.'),
            ]);
        }
        
        // Se todos os schedules estão bloqueados
        if ($blockedSchedules === $totalSchedules && $totalSchedules > 0) {
            throw ValidationException::withMessages([
                'doctor_id' => __('O médico não possui agenda liberada para novos agendamentos. Todos os horários estão bloqueados.'),
            ]);
        }
    }

    /**
     * Valida se o perfil do paciente está completo
     */
    public function ensurePatientProfileCompleted(Patient $patient): void
    {
        if (! $patient->profile_completed_at) {
            throw ValidationException::withMessages([
                'patient' => __('Complete seu perfil antes de agendar uma consulta.'),
            ]);
        }
    }

    /**
     * Valida se a agenda é válida para o horário
     */
    public function ensureScheduleIsValid(Doctor $doctor, CarbonInterface $scheduledAt, int $duration): void
    {
        if ($scheduledAt->lessThan(now()->addDay())) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Consultas devem ser agendadas com pelo menos 24 horas de antecedência.'),
            ]);
        }

        // Verifica bloqueios de data específica
        if (\App\Application\ScheduleBlocks\ScheduleBlockService::isBlocked(
            $doctor->id,
            $scheduledAt->format('Y-m-d'),
            $scheduledAt->format('H:i')
        )) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('O médico bloqueou este horário por imprevisto.'),
            ]);
        }

        $schedule = $doctor->schedules()
            ->where('day_of_week', $scheduledAt->dayOfWeekIso)
            ->where('is_blocked', false)
            ->where('start_time', '<=', $scheduledAt->format('H:i:s'))
            ->where('end_time', '>=', $scheduledAt->copy()->addMinutes($duration)->format('H:i:s'))
            ->first();

        if (! $schedule) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('O médico não possui agenda disponível nesse horário.'),
            ]);
        }
    }

    /**
     * Valida se não há conflitos de horário
     */
    public function ensureNoConflicts(
        Doctor $doctor,
        Patient $patient,
        CarbonInterface $scheduledAt,
        int $duration,
        ?int $ignoreAppointmentId = null
    ): void {
        $endTime = $scheduledAt->copy()->addMinutes($duration);

        // Query compatível com SQLite e PostgreSQL
        $isPostgres = \Illuminate\Support\Facades\DB::getDriverName() === 'pgsql';

        $hasConflict = \App\Models\Appointment::query()
            ->when($ignoreAppointmentId, fn ($query) => $query->where('id', '!=', $ignoreAppointmentId))
            ->where(function ($query) use ($doctor, $patient) {
                $query->where('doctor_id', $doctor->id)
                    ->orWhere('patient_id', $patient->id);
            })
            ->whereIn('status', [
                AppointmentStatus::PENDING->value,
                AppointmentStatus::CONFIRMED->value,
            ])
            ->where(function ($query) use ($scheduledAt, $endTime, $isPostgres) {
                // Conflito: nova consulta começa durante outra (exclusivo nos limites)
                // scheduledAt >= existing.start AND scheduledAt < existing.end
                $query->where(function ($q) use ($scheduledAt, $isPostgres) {
                        $q->where('scheduled_at', '<=', $scheduledAt);
                        if ($isPostgres) {
                            $q->whereRaw(
                                "scheduled_at + (duration_minutes || ' minutes')::interval > ?",
                                [$scheduledAt]
                            );
                        } else {
                            $q->whereRaw(
                                "datetime(scheduled_at, '+' || duration_minutes || ' minutes') > ?",
                                [$scheduledAt]
                            );
                        }
                    })
                    // Conflito: nova consulta termina durante outra
                    // endTime > existing.start AND endTime <= existing.end
                    ->orWhere(function ($q) use ($endTime, $isPostgres) {
                        $q->where('scheduled_at', '<', $endTime);
                        if ($isPostgres) {
                            $q->whereRaw(
                                "scheduled_at + (duration_minutes || ' minutes')::interval >= ?",
                                [$endTime]
                            );
                        } else {
                            $q->whereRaw(
                                "datetime(scheduled_at, '+' || duration_minutes || ' minutes') >= ?",
                                [$endTime]
                            );
                        }
                    })
                    // Conflito: nova consulta engloba completamente outra
                    // scheduledAt < existing.start AND endTime > existing.end
                    ->orWhere(function ($builder) use ($scheduledAt, $endTime, $isPostgres) {
                        $builder->where('scheduled_at', '>', $scheduledAt);

                        if ($isPostgres) {
                            $builder->whereRaw(
                                "scheduled_at + (duration_minutes || ' minutes')::interval < ?",
                                [$endTime]
                            );
                        } else {
                            $builder->whereRaw(
                                "datetime(scheduled_at, '+' || duration_minutes || ' minutes') < ?",
                                [$endTime]
                            );
                        }
                    });
            })
            ->exists();

        if ($hasConflict) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Existe conflito de horário com outra consulta.'),
            ]);
        }
    }

    /**
     * Valida se o cancelamento é permitido
     */
    public function ensureCancellationAllowed(Appointment $appointment, User $user): void
    {
        // Consultas com falta não podem ser canceladas
        if ($appointment->status === AppointmentStatus::NO_SHOW) {
            throw ValidationException::withMessages([
                'status' => __('Consultas com falta registrada não podem ser canceladas.'),
            ]);
        }

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return;
        }

        $scheduledAt = $appointment->scheduled_at;

        if (! $scheduledAt) {
            return;
        }

        if ($scheduledAt->diffInHours(now(), false) >= -24) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Cancelamentos só são permitidos com antecedência mínima de 24 horas.'),
            ]);
        }
    }

    /**
     * Valida se a remarcação é permitida
     */
    public function ensureRescheduleAllowed(Appointment $appointment, User $user): void
    {
        // Consultas com falta não podem ser remarcadas
        if ($appointment->status === AppointmentStatus::NO_SHOW) {
            throw ValidationException::withMessages([
                'status' => __('Consultas com falta registrada não podem ser remarcadas.'),
            ]);
        }

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role !== UserRole::ADMIN) {
            $countReschedules = $appointment->logs()
                ->where('metadata->action', 'rescheduled')
                ->count();

            if ($countReschedules >= 2) {
                throw ValidationException::withMessages([
                    'scheduled_at' => __('Limite de remarcações atingido para esta consulta.'),
                ]);
            }

            if ($appointment->scheduled_at->diffInHours(now(), false) >= -24) {
                throw ValidationException::withMessages([
                    'scheduled_at' => __('Remarcações só são permitidas com antecedência mínima de 24 horas.'),
                ]);
            }
        }

        if ($role === UserRole::DOCTOR && ! $appointment->doctor->user?->is_active) {
            throw ValidationException::withMessages([
                'doctor_id' => __('Perfil do médico inativo.'),
            ]);
        }

        if ($role === UserRole::PATIENT && ! $appointment->patient->user?->is_active) {
            throw ValidationException::withMessages([
                'patient_id' => __('Perfil de paciente inativo.'),
            ]);
        }
    }
}

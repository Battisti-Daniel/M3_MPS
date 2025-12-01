<?php

namespace App\Application\Appointments;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Appointments\AppointmentStatusWorkflow;
use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Infrastructure\Cache\CacheManager;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\DatabaseManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        private NotificationDispatcher $notifications,
        private DatabaseManager $db,
        private AppointmentStatusWorkflow $statusWorkflow,
        private CacheManager $cacheManager,
        private AppointmentCreationService $creationService,
        private AppointmentValidationService $validationService
    ) {}

    public function listForPatient(User $user, array $filters = []): LengthAwarePaginator
    {
        /** @var Patient $patient */
        $patient = $user->patient;
        $patient?->loadMissing('user');

        $cacheKey = 'appointments:patient:'.$patient->id.':'.md5(json_encode($filters));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($patient, $filters) {
            $query = Appointment::query()
                ->with(['doctor.user', 'patient.user'])
                ->where('patient_id', $patient->id)
                ->orderByDesc('created_at');

            if (! empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            $this->applyPeriodFilter($query, $filters);

            return $query->paginate($filters['per_page'] ?? 10);
        });
    }

    public function listForDoctor(User $user, array $filters = []): LengthAwarePaginator
    {
        /** @var Doctor $doctor */
        $doctor = $user->doctor;

        $cacheKey = 'appointments:doctor:'.$doctor->id.':'.md5(json_encode($filters));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($doctor, $filters) {
            $query = Appointment::query()
                ->with(['doctor.user', 'patient.user', 'observations'])
                ->where('doctor_id', $doctor->id)
                ->orderByDesc('created_at');

            if (! empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            $this->applyPeriodFilter($query, $filters);

            return $query->paginate($filters['per_page'] ?? 10);
        });
    }

    public function listForAdmin(array $filters = []): LengthAwarePaginator
    {
        $cacheKey = 'appointments:admin:'.md5(json_encode($filters));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($filters) {
            $query = Appointment::query()
                ->with(['doctor.user', 'patient.user'])
                ->orderByDesc('created_at');

            if (! empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            $this->applyPeriodFilter($query, $filters);

            return $query->paginate($filters['per_page'] ?? 10);
        });
    }

    public function createForPatient(User $user, array $data): Appointment
    {
        $patient = $this->getPatientProfile($user);
        $doctor = $this->getDoctor($data['doctor_id']);
        $scheduledAt = Carbon::parse($data['scheduled_at']);
        $duration = $data['duration_minutes'] ?? 30;

        $this->validateCreation($doctor, $patient, $scheduledAt, $duration);

        $appointment = $this->db->transaction(function () use ($patient, $doctor, $user, $scheduledAt, $duration, $data) {
            return $this->creationService->create(
                $patient,
                $doctor,
                $user,
                $scheduledAt,
                $duration,
                $data
            );
        });

        $this->clearAppointmentCache($patient->id, $doctor->id);

        return $appointment;
    }

    public function createForAdmin(User $user, array $data): Appointment
    {
        $patient = Patient::with('user')->findOrFail($data['patient_id']);
        $doctor = $this->getDoctor($data['doctor_id']);
        $scheduledAt = Carbon::parse($data['scheduled_at']);
        $duration = $data['duration_minutes'] ?? 30;

        $this->validateCreation($doctor, $patient, $scheduledAt, $duration);

        $appointment = $this->db->transaction(function () use ($patient, $doctor, $user, $scheduledAt, $duration, $data) {
            return $this->creationService->create(
                $patient,
                $doctor,
                $user,
                $scheduledAt,
                $duration,
                $data
            );
        });

        $this->clearAppointmentCache($patient->id, $doctor->id);

        return $appointment;
    }

    /**
     * Obtém perfil de paciente do usuário
     */
    protected function getPatientProfile(User $user): Patient
    {
        $patient = $user->patient;

        if (! $patient) {
            throw ValidationException::withMessages([
                'patient' => __('Usuário não possui perfil de paciente.'),
            ]);
        }

        return $patient;
    }

    /**
     * Obtém médico com relacionamentos carregados
     */
    protected function getDoctor(int $doctorId): Doctor
    {
        return Doctor::with('user')->findOrFail($doctorId);
    }

    /**
     * Valida todas as condições para criação de consulta
     */
    protected function validateCreation(
        Doctor $doctor,
        Patient $patient,
        CarbonInterface $scheduledAt,
        int $duration
    ): void {
        $this->validationService->ensureProfilesAreActive($doctor, $patient);
        $this->validationService->ensurePatientNotBlocked($patient);
        $this->validationService->ensureDoctorAllowsScheduling($doctor);
        $this->validationService->ensurePatientProfileCompleted($patient);
        $this->validationService->ensurePatientCanScheduleMore($patient);
        $this->validationService->ensureScheduleIsValid($doctor, $scheduledAt, $duration);
        $this->validationService->ensureNoConflicts($doctor, $patient, $scheduledAt, $duration);
    }

    public function confirm(Appointment $appointment, User $user): Appointment
    {
        $appointment->loadMissing(['doctor.user', 'patient.user']);

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
        $this->statusWorkflow->validateTransition(
            $appointment->status,
            AppointmentStatus::CONFIRMED,
            $role
        );

        $appointment->update([
            'status' => AppointmentStatus::CONFIRMED,
            'confirmed_at' => now(),
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => AppointmentStatus::PENDING,
            'new_status' => AppointmentStatus::CONFIRMED,
            'changed_by' => $user->id,
            'metadata' => ['action' => 'confirmed'],
            'changed_at' => now(),
        ]);

        $this->notifications->dispatchFromTemplate(
            $appointment->patient->user,
            'appointment_confirmed_patient',
            [
                'patient' => $appointment->patient->user->name,
                'doctor' => $appointment->doctor->user->name,
                'date' => $appointment->scheduled_at->translatedFormat('d/m/Y'),
                'time' => $appointment->scheduled_at->translatedFormat('H:i'),
            ],
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment;
    }

    public function cancel(Appointment $appointment, User $user, ?string $reason = null): Appointment
    {
        if ($appointment->status === AppointmentStatus::CANCELLED) {
            return $appointment;
        }

        $this->validationService->ensureCancellationAllowed($appointment, $user);

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
        $this->statusWorkflow->validateTransition(
            $appointment->status,
            AppointmentStatus::CANCELLED,
            $role
        );

        $appointment->update([
            'status' => AppointmentStatus::CANCELLED,
            'cancelled_at' => now(),
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => $appointment->getOriginal('status'),
            'new_status' => AppointmentStatus::CANCELLED,
            'changed_by' => $user->id,
            'reason' => $reason,
            'metadata' => ['action' => 'cancelled'],
            'changed_at' => now(),
        ]);

        // Dispatch notification in background to avoid blocking
        try {
            $this->notifications->dispatchFromTemplate(
                $appointment->patient->user,
                'appointment_cancelled_patient',
                [
                    'patient' => $appointment->patient->user->name,
                    'doctor' => $appointment->doctor->user->name,
                    'reason' => $reason ? $reason : __('Não informado'),
                ],
                metadata: ['appointment_id' => $appointment->id, 'reason' => $reason]
            );
        } catch (\Throwable $e) {
            \Log::warning('Failed to dispatch cancellation notification', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Clear cache in background
        try {
            $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);
        } catch (\Throwable $e) {
            \Log::warning('Failed to clear appointment cache', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $appointment->refresh();
    }

    public function complete(Appointment $appointment, User $user): Appointment
    {
        $appointment->loadMissing(['doctor.user', 'patient.user']);

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
        $this->statusWorkflow->validateTransition(
            $appointment->status,
            AppointmentStatus::COMPLETED,
            $role
        );

        $appointment->update([
            'status' => AppointmentStatus::COMPLETED,
            'completed_at' => now(),
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => $appointment->getOriginal('status'),
            'new_status' => AppointmentStatus::COMPLETED,
            'changed_by' => $user->id,
            'metadata' => ['action' => 'completed'],
            'changed_at' => now(),
        ]);

        // Quando completa uma consulta, reseta o contador de faltas consecutivas
        $patient = $appointment->patient;
        if ($patient->consecutive_no_shows > 0) {
            $patient->consecutive_no_shows = 0;
            $patient->save();
        }

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment->refresh();
    }

    /**
     * Marca uma consulta como falta (NO_SHOW)
     */
    public function markAsNoShow(Appointment $appointment, User $user): Appointment
    {
        $appointment->loadMissing(['doctor.user', 'patient.user']);

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
        
        // Apenas admin ou médico podem marcar falta
        if (!in_array($role, [UserRole::ADMIN, UserRole::DOCTOR])) {
            throw ValidationException::withMessages([
                'status' => __('Apenas administradores ou médicos podem marcar falta.'),
            ]);
        }

        // Não pode marcar falta em consultas já finalizadas
        if ($appointment->status->isFinal()) {
            throw ValidationException::withMessages([
                'status' => __('Não é possível marcar falta em consultas já finalizadas.'),
            ]);
        }

        // Já está marcada como NO_SHOW
        if ($appointment->status === AppointmentStatus::NO_SHOW) {
            throw ValidationException::withMessages([
                'status' => __('Esta consulta já está marcada como não compareceu.'),
            ]);
        }

        $oldStatus = $appointment->status;

        $appointment->update([
            'status' => AppointmentStatus::NO_SHOW,
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => $oldStatus,
            'new_status' => AppointmentStatus::NO_SHOW,
            'changed_by' => $user->id,
            'metadata' => ['action' => 'marked_no_show'],
            'changed_at' => now(),
        ]);

        // Atualiza contador de faltas e bloqueia se necessário
        $patient = $appointment->patient;
        $this->validationService->updateNoShowCountAndBlock($patient);

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment->refresh();
    }

    public function reschedule(Appointment $appointment, User $user, array $data): Appointment
    {
        $newDate = Carbon::parse($data['scheduled_at']);
        $duration = $data['duration_minutes'] ?? $appointment->duration_minutes;

        $doctor = $appointment->doctor;
        $patient = $appointment->patient;

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role !== UserRole::ADMIN) {
            $this->validationService->ensureScheduleIsValid($doctor, $newDate, $duration);
        }

        $this->validationService->ensureRescheduleAllowed($appointment, $user);
        $this->validationService->ensureNoConflicts($doctor, $patient, $newDate, $duration, $appointment->id);

        $oldStatus = $appointment->status;

        $appointment->update([
            'scheduled_at' => $newDate,
            'duration_minutes' => $duration,
            'status' => AppointmentStatus::PENDING,
            'confirmed_at' => null,
            'cancelled_at' => null,
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => $oldStatus,
            'new_status' => AppointmentStatus::PENDING,
            'changed_by' => $user->id,
            'metadata' => ['action' => 'rescheduled'],
            'changed_at' => now(),
        ]);

        $rescheduleContext = [
            'patient' => $appointment->patient->user->name,
            'doctor' => $appointment->doctor->user->name,
            'date' => $newDate->translatedFormat('d/m/Y'),
            'time' => $newDate->translatedFormat('H:i'),
        ];

        $this->notifications->dispatchFromTemplate(
            $appointment->patient->user,
            'appointment_rescheduled_patient',
            $rescheduleContext,
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->notifications->dispatchFromTemplate(
            $appointment->doctor->user,
            'appointment_rescheduled_doctor',
            $rescheduleContext,
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment->refresh();
    }

    protected function applyPeriodFilter(Builder $query, array $filters): void
    {
        // Filtro por data específica
        if (!empty($filters['start_date'])) {
            $query->whereDate('scheduled_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('scheduled_at', '<=', $filters['end_date']);
        }

        // Filtro por período (future/past/all)
        if (empty($filters['period'])) {
            return;
        }

        $now = now();

        match ($filters['period']) {
            'future' => $query->where('scheduled_at', '>', $now),
            'past' => $query->where('scheduled_at', '<', $now),
            'all' => null, // Não aplica filtro
            default => null,
        };
    }

    /**
     * Limpa cache relacionado a consultas
     */
    protected function clearAppointmentCache(?int $patientId = null, ?int $doctorId = null): void
    {
        $this->cacheManager->clearAppointmentCache($patientId, $doctorId);
    }
}

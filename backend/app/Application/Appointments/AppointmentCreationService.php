<?php

namespace App\Application\Appointments;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Shared\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\CarbonInterface;

/**
 * Serviço responsável pela criação de consultas
 *
 * Separa a lógica de criação do AppointmentService principal
 * seguindo o princípio de responsabilidade única
 */
class AppointmentCreationService
{
    public function __construct(
        private NotificationDispatcher $notifications
    ) {}

    /**
     * Cria uma nova consulta e registra log
     */
    public function create(
        Patient $patient,
        Doctor $doctor,
        User $creator,
        CarbonInterface $scheduledAt,
        int $duration,
        array $data
    ): Appointment {
        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => $duration,
            'status' => AppointmentStatus::PENDING,
            'type' => $data['type'] ?? 'PRESENTIAL',
            'price' => $data['price'] ?? null,
            'notes' => $data['notes'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'created_by' => $creator->id,
        ]);

        $this->createLog($appointment, $creator);
        $this->sendNotifications($appointment, $patient, $doctor, $scheduledAt);

        return $appointment->load(['doctor.user', 'patient.user']);
    }

    /**
     * Cria log de criação da consulta
     */
    protected function createLog(Appointment $appointment, User $creator): void
    {
        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => null,
            'new_status' => AppointmentStatus::PENDING,
            'changed_by' => $creator->id,
            'metadata' => ['action' => 'created'],
            'changed_at' => now(),
        ]);
    }

    /**
     * Envia notificações para médico e paciente
     */
    protected function sendNotifications(
        Appointment $appointment,
        Patient $patient,
        Doctor $doctor,
        CarbonInterface $scheduledAt
    ): void {
        $context = [
            'patient' => $patient->user->name,
            'doctor' => $doctor->user->name,
            'date' => $scheduledAt->translatedFormat('d/m/Y'),
            'time' => $scheduledAt->translatedFormat('H:i'),
        ];

        $this->notifications->dispatchFromTemplate(
            $doctor->user,
            'appointment_created_doctor',
            $context,
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->notifications->dispatchFromTemplate(
            $patient->user,
            'appointment_created_patient',
            $context,
            metadata: ['appointment_id' => $appointment->id]
        );
    }
}

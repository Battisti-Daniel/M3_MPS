<?php

namespace App\Application\Observations;

use App\Models\Appointment;
use App\Models\Observation;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ObservationService
{
    public function create(User $doctorUser, Appointment $appointment, array $data): Observation
    {
        $doctor = $doctorUser->doctor;

        if (! $doctor || $appointment->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'appointment' => __('Somente o médico responsável pode registrar observações.'),
            ]);
        }

        return DB::transaction(function () use ($appointment, $doctor, $data) {
            return Observation::create([
                'appointment_id' => $appointment->id,
                'doctor_id' => $doctor->id,
                'patient_id' => $appointment->patient_id,
                'anamnesis' => $data['anamnesis'],
                'diagnosis' => $data['diagnosis'] ?? null,
                'prescription' => $data['prescription'] ?? null,
                'notes' => $data['notes'] ?? null,
                'attachments' => $data['attachments'] ?? null,
            ]);
        });
    }

    public function listForPatient(User $patientUser, int $perPage = 20): LengthAwarePaginator
    {
        $patient = $patientUser->patient;

        if (! $patient) {
            throw ValidationException::withMessages([
                'patient' => __('Somente pacientes podem acessar este histórico.'),
            ]);
        }

        return Observation::query()
            ->where('patient_id', $patient->id)
            ->with([
                'doctor.user',
                'patient.user',
                'appointment.doctor.user',
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function listForDoctor(User $doctorUser, int $patientId, int $perPage = 20): LengthAwarePaginator
    {
        $doctor = $doctorUser->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'doctor' => __('Somente médicos podem acessar este histórico.'),
            ]);
        }

        $hasRelationship = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->where('patient_id', $patientId)
            ->exists();

        if (! $hasRelationship) {
            throw ValidationException::withMessages([
                'patient' => __('Você não possui atendimentos registrados para este paciente.'),
            ]);
        }

        return Observation::query()
            ->where('patient_id', $patientId)
            ->with([
                'doctor.user',
                'patient.user',
                'appointment.doctor.user',
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
}

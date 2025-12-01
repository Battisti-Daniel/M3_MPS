<?php

namespace App\Http\Resources;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

/** @mixin \App\Models\Observation */
class ObservationResource extends JsonResource
{
    public function toArray($request): array
    {
        $user = Auth::user();
        $role = $user?->role instanceof UserRole ? $user->role : ($user?->role ? UserRole::from($user->role) : null);

        // Pacientes podem ver suas próprias observações (direito de acesso aos dados médicos)
        // Médicos e admins podem ver todas as observações
        $canViewClinicalData = $role === UserRole::DOCTOR 
            || $role === UserRole::ADMIN 
            || ($role === UserRole::PATIENT && $user?->patient?->id === $this->patient_id);

        return [
            'id' => $this->id,
            'appointment_id' => $this->appointment_id,
            'doctor_id' => $this->doctor_id,
            'patient_id' => $this->patient_id,
            'anamnesis' => $canViewClinicalData ? $this->anamnesis : null,
            'diagnosis' => $canViewClinicalData ? $this->diagnosis : null,
            'prescription' => $canViewClinicalData ? $this->prescription : null,
            'notes' => $canViewClinicalData ? $this->notes : null,
            'attachments' => $canViewClinicalData ? $this->attachments : null,
            'created_at' => $this->created_at,
            'doctor' => new DoctorResource($this->whenLoaded('doctor')),
            'patient' => new PatientResource($this->whenLoaded('patient')),
            'appointment' => $this->whenLoaded('appointment', function () {
                return [
                    'id' => $this->appointment->id,
                    'scheduled_at' => $this->appointment->scheduled_at,
                    'status' => $this->appointment->status,
                    'type' => $this->appointment->type ?? 'PRESENTIAL',
                    'doctor' => new DoctorResource($this->appointment->doctor),
                ];
            }),
        ];
    }
}

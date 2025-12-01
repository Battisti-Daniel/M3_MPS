<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HealthInsurance */
class HealthInsuranceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'coverage_percentage' => $this->coverage_percentage,
            'is_active' => $this->is_active,
            'beneficiaries_count' => $this->when(isset($this->beneficiaries_count), fn () => $this->beneficiaries_count),
            'doctors_count' => $this->when(isset($this->doctors_count), fn () => $this->doctors_count),
            'pivot' => $this->whenPivotLoaded(
                'patient_health_insurance',
                fn () => [
                    'policy_number' => $this->pivot->policy_number,
                    'is_active' => $this->pivot->is_active,
                ]
            ),
            'pivot_doctor' => $this->whenPivotLoaded(
                'doctor_health_insurance',
                fn () => [
                    'is_active' => $this->pivot->is_active,
                ]
            ),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Doctor */
class DoctorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->whenLoaded('user', fn () => $this->user->name),
            'crm' => $this->crm,
            'specialty' => $this->specialty,
            'qualification' => $this->qualification,
            'is_active' => $this->is_active,
            'user' => new UserResource($this->whenLoaded('user')),
            'health_insurances' => HealthInsuranceResource::collection($this->whenLoaded('healthInsurances')),
            'schedules' => ScheduleResource::collection($this->whenLoaded('schedules')),
        ];
    }
}

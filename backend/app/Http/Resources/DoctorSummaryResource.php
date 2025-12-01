<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Doctor */
class DoctorSummaryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'crm' => $this->crm,
            'specialty' => $this->specialty,
            'is_active' => $this->is_active,
        ];
    }
}

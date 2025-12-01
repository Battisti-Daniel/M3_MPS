<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AppointmentLog */
class AppointmentLogResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'old_status' => $this->old_status,
            'new_status' => $this->new_status,
            'reason' => $this->reason,
            'metadata' => $this->metadata,
            'changed_at' => $this->changed_at,
            'changed_by' => new UserResource($this->whenLoaded('changedBy')),
        ];
    }
}

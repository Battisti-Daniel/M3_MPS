<?php

namespace App\Application\Privacy;

use App\Events\DataRetentionPruning;
use App\Models\ActivityLog;
use App\Models\AppointmentLog;
use App\Models\DataRetentionPolicy;
use App\Models\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DataRetentionService
{
    public function enforce(): Collection
    {
        return DataRetentionPolicy::query()
            ->get()
            ->map(function (DataRetentionPolicy $policy) {
                $threshold = Carbon::now()->subDays($policy->retention_days);
                $deleted = match ($policy->resource) {
                    'activity_logs' => ActivityLog::query()->where('created_at', '<', $threshold)->delete(),
                    'notifications' => Notification::query()->where('created_at', '<', $threshold)->delete(),
                    'appointment_logs' => AppointmentLog::query()->where('created_at', '<', $threshold)->delete(),
                    default => $this->dispatchCustomPruner($policy->resource, $threshold),
                };

                return [
                    'resource' => $policy->resource,
                    'retention_days' => $policy->retention_days,
                    'deleted' => $deleted ?? 0,
                ];
            });
    }

    protected function dispatchCustomPruner(string $resource, Carbon $threshold): ?int
    {
        $event = new DataRetentionPruning($resource, $threshold);

        event($event);

        return $event->deleted;
    }
}

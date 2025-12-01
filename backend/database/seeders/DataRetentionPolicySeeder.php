<?php

namespace Database\Seeders;

use App\Models\DataRetentionPolicy;
use Illuminate\Database\Seeder;

class DataRetentionPolicySeeder extends Seeder
{
    public function run(): void
    {
        $policies = [
            ['resource' => 'activity_logs', 'retention_days' => 180],
            ['resource' => 'notifications', 'retention_days' => 90],
            ['resource' => 'appointment_logs', 'retention_days' => 365],
        ];

        foreach ($policies as $policy) {
            DataRetentionPolicy::updateOrCreate(
                ['resource' => $policy['resource']],
                ['retention_days' => $policy['retention_days']]
            );
        }
    }
}

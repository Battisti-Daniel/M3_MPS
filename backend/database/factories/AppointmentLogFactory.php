<?php

namespace Database\Factories;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AppointmentLog>
 */
class AppointmentLogFactory extends Factory
{
    protected $model = AppointmentLog::class;

    public function definition(): array
    {
        $oldStatus = fake()->randomElement(AppointmentStatus::cases());
        $newStatus = fake()->randomElement(array_filter(AppointmentStatus::cases(), fn ($status) => $status !== $oldStatus));

        return [
            'appointment_id' => Appointment::factory(),
            'old_status' => $oldStatus->value,
            'new_status' => $newStatus->value,
            'changed_by' => User::factory()->admin(),
            'reason' => fake()->optional()->sentence(),
            'metadata' => ['via' => 'factory'],
            'changed_at' => now(),
        ];
    }
}

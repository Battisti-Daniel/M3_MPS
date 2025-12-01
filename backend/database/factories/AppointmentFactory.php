<?php

namespace Database\Factories;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        $scheduledAt = fake()->dateTimeBetween('+1 day', '+2 months');

        return [
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => fake()->randomElement([30, 40, 50]),
            'status' => AppointmentStatus::PENDING->value,
            'type' => fake()->randomElement(['PRESENTIAL', 'ONLINE']),
            'price' => fake()->randomFloat(2, 80, 400),
            'notes' => fake()->optional()->sentence(10),
            'metadata' => ['source' => fake()->randomElement(['portal', 'telefone'])],
            'confirmed_at' => null,
            'cancelled_at' => null,
            'completed_at' => null,
            'reminder_sent_at' => null,
            'created_by' => User::factory()->admin(),
        ];
    }

    public function confirmed(): static
    {
        return $this->state(function (array $attributes) {
            $confirmedAt = now()->addDays(1);

            return [
                'status' => AppointmentStatus::CONFIRMED->value,
                'confirmed_at' => $confirmedAt,
            ];
        });
    }

    public function cancelled(): static
    {
        return $this->state(function (array $attributes) {
            $cancelledAt = now()->addDays(1);

            return [
                'status' => AppointmentStatus::CANCELLED->value,
                'cancelled_at' => $cancelledAt,
            ];
        });
    }
}

<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Schedule>
 */
class ScheduleFactory extends Factory
{
    protected $model = Schedule::class;

    public function definition(): array
    {
        $start = fake()->time('H:i');
        $end = now()->setTimeFromTimeString($start)->addMinutes(240)->format('H:i');

        return [
            'doctor_id' => Doctor::factory(),
            'day_of_week' => fake()->numberBetween(1, 6),
            'start_time' => $start,
            'end_time' => $end,
            'slot_duration_minutes' => fake()->randomElement([20, 30, 40]),
            'is_blocked' => false,
            'blocked_reason' => null,
        ];
    }
}

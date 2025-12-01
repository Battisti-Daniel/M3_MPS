<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    protected $model = Doctor::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->doctor(),
            'crm' => 'CRM-'.fake()->unique()->numerify('######'),
            'specialty' => fake()->randomElement(['Cardiologia', 'Dermatologia', 'Pediatria', 'Clínico Geral']),
            'qualification' => fake()->sentence(8),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}

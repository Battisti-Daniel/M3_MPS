<?php

namespace Database\Factories;

use App\Models\HealthInsurance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HealthInsurance>
 */
class HealthInsuranceFactory extends Factory
{
    protected $model = HealthInsurance::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company().' Saúde',
            'description' => fake()->sentence(12),
            'coverage_percentage' => fake()->numberBetween(40, 100),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}

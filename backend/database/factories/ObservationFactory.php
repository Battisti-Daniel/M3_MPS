<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Observation;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Observation>
 */
class ObservationFactory extends Factory
{
    protected $model = Observation::class;

    public function definition(): array
    {
        return [
            'appointment_id' => Appointment::factory(),
            'doctor_id' => Doctor::factory(),
            'patient_id' => Patient::factory(),
            'anamnesis' => fake()->paragraph(3),
            'diagnosis' => fake()->optional()->sentence(12),
            'prescription' => fake()->optional()->paragraph(),
            'notes' => fake()->optional()->paragraph(),
            'attachments' => null,
        ];
    }
}

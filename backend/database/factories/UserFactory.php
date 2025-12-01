<?php

namespace Database\Factories;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'phone' => fake()->numerify('+55###########'),
            'is_active' => true,
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'privacy_policy_accepted_at' => now(),
            'privacy_policy_version' => config('privacy.policy_version'),
            'data_erasure_requested_at' => null,
            'role' => fake()->randomElement(UserRole::cases())->value,
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function asRole(UserRole $role): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => $role->value,
        ]);
    }

    public function admin(): static
    {
        return $this->asRole(UserRole::ADMIN);
    }

    public function doctor(): static
    {
        return $this->asRole(UserRole::DOCTOR);
    }

    public function patient(): static
    {
        return $this->asRole(UserRole::PATIENT);
    }
}

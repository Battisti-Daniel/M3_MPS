<?php

namespace Database\Factories;

use App\Domain\Shared\Enums\NotificationChannel;
use App\Domain\Shared\Enums\NotificationType;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        $type = fake()->randomElement(NotificationType::cases());

        return [
            'user_id' => User::factory(),
            'type' => $type->value,
            'subject' => match ($type) {
                NotificationType::REMINDER => 'Lembrete de consulta',
                NotificationType::CONFIRMATION => 'Consulta confirmada',
                NotificationType::CANCELLATION => 'Consulta cancelada',
                NotificationType::RESCHEDULING => 'Consulta remarcada',
            },
            'message' => fake()->sentence(12),
            'channel' => fake()->randomElement(NotificationChannel::cases())->value,
            'is_read' => false,
            'is_suppressed' => false,
            'sent_attempts' => 0,
            'sent_at' => now(),
            'last_attempt_at' => null,
            'error_message' => null,
            'metadata' => ['trigger' => 'factory'],
        ];
    }

    public function read(): static
    {
        return $this->state(fn () => [
            'is_read' => true,
            'read_at' => now(),
        ]);
    }
}

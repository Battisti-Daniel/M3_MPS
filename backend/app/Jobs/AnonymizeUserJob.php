<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AnonymizeUserJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private int $userId)
    {
        $this->onQueue('maintenance');
    }

    public function handle(): void
    {
        /** @var User|null $user */
        $user = User::with(['patient', 'doctor'])->find($this->userId);

        if (! $user) {
            return;
        }

        $user->forceFill([
            'name' => sprintf('Usuário Anônimo %d', $user->id),
            'email' => sprintf('anon-%d@anon.agendaplus', $user->id),
            'phone' => sprintf('+550000%04d', $user->id),
            'is_active' => false,
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ])->save();

        if ($user->patient) {
            $user->patient->forceFill([
                'cpf' => null,
                'address' => null,
                'gender' => null,
                'profile_completed_at' => null,
            ])->save();
        }

        if ($user->doctor) {
            $user->doctor->forceFill([
                'crm' => sprintf('ANON-%d', $user->id),
                'qualification' => null,
                'is_active' => false,
            ])->save();
        }
    }
}

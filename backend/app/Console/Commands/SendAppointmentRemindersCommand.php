<?php

namespace App\Console\Commands;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\NotificationType;
use App\Models\Appointment;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendAppointmentRemindersCommand extends Command
{
    protected $signature = 'appointments:send-reminders {--hours=24 : Horas antes da consulta para envio do lembrete}';

    protected $description = 'Envia notificações de lembrete para consultas próximas';

    public function __construct(private NotificationDispatcher $dispatcher)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $windowStart = Carbon::now()->addHours($hours);
        $windowEnd = $windowStart->copy()->addHour();

        $appointments = Appointment::query()
            ->with(['patient.user', 'doctor.user'])
            ->whereBetween('scheduled_at', [$windowStart, $windowEnd])
            ->whereIn('status', [
                AppointmentStatus::PENDING->value,
                AppointmentStatus::CONFIRMED->value,
            ])
            ->whereNull('reminder_sent_at')
            ->get();

        if ($appointments->isEmpty()) {
            $this->info('Nenhuma consulta identificada para envio de lembrete.');

            return self::SUCCESS;
        }

        $this->info("Encontradas {$appointments->count()} consultas para envio de lembrete.");

        foreach ($appointments as $appointment) {
            if (! $appointment->patient?->user) {
                continue;
            }

            $message = __('Olá :nome, lembramos da sua consulta com :doctor em :data às :hora.', [
                'nome' => $appointment->patient->user->name,
                'doctor' => $appointment->doctor?->user?->name ?? __('nosso especialista'),
                'data' => $appointment->scheduled_at->translatedFormat('d/m/Y'),
                'hora' => $appointment->scheduled_at->translatedFormat('H:i'),
            ]);

            $this->dispatcher->dispatch(
                $appointment->patient->user,
                NotificationType::REMINDER,
                __('Lembrete de consulta'),
                $message,
                metadata: [
                    'appointment_id' => $appointment->id,
                    'trigger' => 'appointment_reminder',
                    'scheduled_at' => $appointment->scheduled_at,
                ]
            );

            $appointment->update(['reminder_sent_at' => now()]);
        }

        $this->info('Processamento finalizado com sucesso.');

        return self::SUCCESS;
    }
}

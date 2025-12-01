<?php

namespace Database\Seeders;

use App\Application\Notifications\NotificationDispatcher;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;

class TestNotificationsSeeder extends Seeder
{
    public function run(): void
    {
        $dispatcher = app(NotificationDispatcher::class);
        
        // Buscar o paciente Daniel Battisti ou o primeiro paciente disponível
        $user = User::where('email', 'danielbattisti@outlook.com.br')->first();
        $patient = $user ? Patient::where('user_id', $user->id)->with('user')->first() : null;
        
        if (!$patient) {
            $patient = Patient::with('user')->first();
        }
        
        $doctor = Doctor::with('user')->first();
        
        if (!$patient || !$doctor) {
            $this->command->warn('Paciente ou médico não encontrado. Pulando...');
            return;
        }

        $this->command->info("Criando notificações para: {$patient->user->name}");

        // Notificação de consulta agendada para paciente
        $dispatcher->dispatchFromTemplate(
            $patient->user,
            'appointment_created_patient',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'date' => now()->addDays(3)->format('d/m/Y'),
                'time' => '14:00',
            ],
            metadata: ['appointment_id' => 1]
        );
        $this->command->info('✓ Notificação de agendamento criada para paciente');

        // Notificação de consulta confirmada
        $dispatcher->dispatchFromTemplate(
            $patient->user,
            'appointment_confirmed_patient',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'date' => now()->addDays(3)->format('d/m/Y'),
                'time' => '14:00',
            ],
            metadata: ['appointment_id' => 1]
        );
        $this->command->info('✓ Notificação de confirmação criada para paciente');

        // Notificação de lembrete
        $dispatcher->dispatchFromTemplate(
            $patient->user,
            'appointment_reminder_patient',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'date' => now()->addDay()->format('d/m/Y'),
                'time' => '10:30',
            ],
            metadata: ['appointment_id' => 2]
        );
        $this->command->info('✓ Notificação de lembrete criada para paciente');

        // Notificação de remarcação
        $dispatcher->dispatchFromTemplate(
            $patient->user,
            'appointment_rescheduled_patient',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'date' => now()->addDays(5)->format('d/m/Y'),
                'time' => '16:00',
            ],
            metadata: ['appointment_id' => 3]
        );
        $this->command->info('✓ Notificação de remarcação criada para paciente');

        // Notificação de cancelamento
        $dispatcher->dispatchFromTemplate(
            $patient->user,
            'appointment_cancelled_patient',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'reason' => 'Médico precisou remarcar por motivo pessoal',
            ],
            metadata: ['appointment_id' => 4]
        );
        $this->command->info('✓ Notificação de cancelamento criada para paciente');

        // Notificação de consulta realizada
        $dispatcher->dispatchFromTemplate(
            $patient->user,
            'appointment_completed_patient',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
            ],
            metadata: ['appointment_id' => 5]
        );
        $this->command->info('✓ Notificação de consulta realizada criada para paciente');

        // Notificações para o médico
        $dispatcher->dispatchFromTemplate(
            $doctor->user,
            'appointment_created_doctor',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'date' => now()->addDays(3)->format('d/m/Y'),
                'time' => '14:00',
            ],
            metadata: ['appointment_id' => 1]
        );
        $this->command->info('✓ Notificação de agendamento criada para médico');

        $dispatcher->dispatchFromTemplate(
            $doctor->user,
            'appointment_confirmed_doctor',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'date' => now()->addDays(3)->format('d/m/Y'),
                'time' => '14:00',
            ],
            metadata: ['appointment_id' => 1]
        );
        $this->command->info('✓ Notificação de confirmação criada para médico');

        $dispatcher->dispatchFromTemplate(
            $doctor->user,
            'appointment_reminder_doctor',
            [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'date' => now()->addDay()->format('d/m/Y'),
                'time' => '10:30',
            ],
            metadata: ['appointment_id' => 2]
        );
        $this->command->info('✓ Notificação de lembrete criada para médico');

        $this->command->info('');
        $this->command->info('Todas as notificações de teste foram criadas!');
    }
}

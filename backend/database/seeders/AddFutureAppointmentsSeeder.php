<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AddFutureAppointmentsSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'danielbattisti@outlook.com.br')->first();
        
        if (!$user) {
            $this->command->warn('Usuário não encontrado.');
            return;
        }
        
        $patient = Patient::where('user_id', $user->id)->first();
        $doctors = Doctor::with('user')->take(3)->get();

        $this->command->info("Adicionando consultas futuras para: {$user->name}");

        $futureAppointments = [
            [
                'doctor_id' => $doctors[0]->id,
                'scheduled_at' => Carbon::now()->addDays(7)->setTime(9, 30),
                'status' => AppointmentStatus::CONFIRMED,
                'type' => 'TELEMEDICINE',
                'notes' => 'Consulta online - acompanhamento geral',
            ],
            [
                'doctor_id' => $doctors[2]->id,
                'scheduled_at' => Carbon::now()->addDays(10)->setTime(11, 0),
                'status' => AppointmentStatus::PENDING,
                'type' => 'PRESENTIAL',
                'notes' => 'Primeira consulta - avaliação completa',
            ],
            [
                'doctor_id' => $doctors[1]->id,
                'scheduled_at' => Carbon::now()->addDays(14)->setTime(15, 30),
                'status' => AppointmentStatus::CONFIRMED,
                'type' => 'PRESENTIAL',
                'notes' => 'Retorno cardiologia com exames',
            ],
            [
                'doctor_id' => $doctors[0]->id,
                'scheduled_at' => Carbon::now()->addDays(21)->setTime(16, 0),
                'status' => AppointmentStatus::PENDING,
                'type' => 'PRESENTIAL',
                'notes' => 'Consulta de rotina mensal',
            ],
        ];

        foreach ($futureAppointments as $data) {
            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $data['doctor_id'],
                'scheduled_at' => $data['scheduled_at'],
                'duration_minutes' => 30,
                'status' => $data['status'],
                'type' => $data['type'],
                'price' => rand(150, 300),
                'notes' => $data['notes'],
                'confirmed_at' => $data['status'] === AppointmentStatus::CONFIRMED ? now() : null,
                'created_by' => $user->id,
            ]);

            $doctor = $doctors->firstWhere('id', $data['doctor_id']);
            $statusLabel = $data['status'] === AppointmentStatus::CONFIRMED ? '✓ Confirmada' : '⏳ Pendente';
            $this->command->info("{$statusLabel}: {$data['scheduled_at']->format('d/m/Y H:i')} - Dr(a). {$doctor->user->name}");
        }

        $this->command->info('');
        $this->command->info('Consultas futuras adicionadas com sucesso!');
    }
}

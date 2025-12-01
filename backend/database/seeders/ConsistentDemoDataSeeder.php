<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ConsistentDemoDataSeeder extends Seeder
{
    /**
     * Seed com dados consistentes e realistas para demonstracao
     */
    public function run(): void
    {
        // Limpar appointments existentes para recriar (PostgreSQL)
        DB::statement('TRUNCATE TABLE appointment_logs RESTART IDENTITY CASCADE');
        DB::statement('TRUNCATE TABLE appointments RESTART IDENTITY CASCADE');

        $admin = User::where('email', 'admin@agendaplus.test')->first();
        if (!$admin) {
            $admin = User::first();
        }

        $doctors = Doctor::with('user')->get();
        $patients = Patient::with('user')->get();

        if ($doctors->isEmpty() || $patients->isEmpty()) {
            $this->command->warn('Execute DatabaseSeeder primeiro para criar medicos e pacientes.');
            return;
        }

        // Precos por especialidade
        $pricesBySpecialty = [
            'Cardiologia' => [250, 300, 350],
            'Dermatologia' => [200, 250, 280],
            'Ortopedia' => [220, 270, 320],
            'Pediatria' => [180, 220, 250],
            'Ginecologia' => [200, 250, 300],
            'Neurologia' => [280, 350, 400],
            'Oftalmologia' => [180, 220, 260],
            'Clinica Geral' => [150, 180, 200],
            'Psiquiatria' => [300, 400, 500],
            'Endocrinologia' => [250, 300, 350],
        ];

        // Definir pacientes com perfis de frequencia diferentes
        $patientProfiles = [
            // Pacientes muito frequentes (8-15 consultas)
            ['min' => 10, 'max' => 15, 'completion_rate' => 85, 'no_show_rate' => 5],
            ['min' => 8, 'max' => 12, 'completion_rate' => 80, 'no_show_rate' => 8],
            ['min' => 8, 'max' => 10, 'completion_rate' => 90, 'no_show_rate' => 3],
            // Pacientes frequentes (5-8 consultas)
            ['min' => 5, 'max' => 8, 'completion_rate' => 75, 'no_show_rate' => 10],
            ['min' => 5, 'max' => 7, 'completion_rate' => 85, 'no_show_rate' => 5],
            ['min' => 4, 'max' => 6, 'completion_rate' => 70, 'no_show_rate' => 15],
            // Pacientes moderados (3-5 consultas)
            ['min' => 3, 'max' => 5, 'completion_rate' => 80, 'no_show_rate' => 10],
            ['min' => 3, 'max' => 4, 'completion_rate' => 75, 'no_show_rate' => 12],
            // Pacientes esporadicos (1-3 consultas)
            ['min' => 1, 'max' => 3, 'completion_rate' => 85, 'no_show_rate' => 5],
            ['min' => 1, 'max' => 2, 'completion_rate' => 90, 'no_show_rate' => 5],
        ];

        $startDate = Carbon::now()->subMonths(3);
        $endDate = Carbon::now();

        foreach ($patients as $index => $patient) {
            // Atribuir perfil ao paciente
            $profileIndex = $index % count($patientProfiles);
            $profile = $patientProfiles[$profileIndex];

            $numAppointments = rand($profile['min'], $profile['max']);
            $completedCount = (int) round($numAppointments * ($profile['completion_rate'] / 100));
            $noShowCount = (int) round($numAppointments * ($profile['no_show_rate'] / 100));
            $cancelledCount = $numAppointments - $completedCount - $noShowCount;

            // Garantir que nao temos numeros negativos
            if ($cancelledCount < 0) {
                $cancelledCount = 0;
                $completedCount = $numAppointments - $noShowCount;
            }

            // Criar consultas para este paciente
            for ($i = 0; $i < $numAppointments; $i++) {
                $doctor = $doctors->random();
                $specialty = $doctor->specialty ?? 'Clinica Geral';
                $prices = $pricesBySpecialty[$specialty] ?? [150, 200, 250];
                $price = $prices[array_rand($prices)];

                // Data aleatoria no periodo - usar segundos unicos para evitar conflitos
                $baseTimestamp = rand($startDate->timestamp, $endDate->timestamp);
                $scheduledAt = Carbon::createFromTimestamp($baseTimestamp)
                    ->setHour(rand(8, 17))
                    ->setMinute(rand(0, 11) * 5) // 5 em 5 minutos para mais opcoes
                    ->setSecond(rand(0, 59)); // Segundos aleatorios para unicidade

                // Determinar status baseado na distribuicao do perfil
                if ($i < $completedCount) {
                    $status = AppointmentStatus::COMPLETED;
                    $confirmedAt = $scheduledAt->copy()->subDays(rand(1, 5));
                    $completedAt = $scheduledAt->copy()->addMinutes(rand(20, 40));
                    $finalPrice = $price;
                } elseif ($i < $completedCount + $noShowCount) {
                    $status = AppointmentStatus::NO_SHOW;
                    $confirmedAt = $scheduledAt->copy()->subDays(rand(1, 3));
                    $completedAt = null;
                    $finalPrice = 0; // No-show nao gera receita
                } else {
                    $status = AppointmentStatus::CANCELLED;
                    $confirmedAt = null;
                    $completedAt = null;
                    $finalPrice = 0; // Cancelado nao gera receita
                }

                // Criar appointment
                $appointment = Appointment::create([
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'scheduled_at' => $scheduledAt,
                    'status' => $status,
                    'type' => 'CONSULTATION',
                    'duration_minutes' => 30,
                    'notes' => $this->getRandomNote($status),
                    'price' => $finalPrice,
                    'confirmed_at' => $confirmedAt,
                    'completed_at' => $completedAt,
                    'created_by' => $admin?->id,
                    'created_at' => $scheduledAt->copy()->subDays(rand(7, 30)),
                    'updated_at' => $completedAt ?? $scheduledAt,
                ]);

                // Criar log
                AppointmentLog::create([
                    'appointment_id' => $appointment->id,
                    'old_status' => null,
                    'new_status' => $status,
                    'changed_by' => $admin?->id,
                    'changed_at' => $appointment->created_at,
                    'reason' => 'Consulta agendada via seeder',
                ]);
            }
        }

        // Adicionar algumas consultas futuras (PENDING e CONFIRMED)
        $futureDate = Carbon::now()->addDays(1);
        $futureEndDate = Carbon::now()->addDays(30);

        foreach ($patients->take(15) as $patient) {
            $numFuture = rand(1, 3);
            
            for ($i = 0; $i < $numFuture; $i++) {
                $doctor = $doctors->random();
                $specialty = $doctor->specialty ?? 'Clinica Geral';
                $prices = $pricesBySpecialty[$specialty] ?? [150, 200, 250];
                $price = $prices[array_rand($prices)];

                $baseTimestamp = rand($futureDate->timestamp, $futureEndDate->timestamp);
                $scheduledAt = Carbon::createFromTimestamp($baseTimestamp)
                    ->setHour(rand(8, 17))
                    ->setMinute(rand(0, 11) * 5)
                    ->setSecond(rand(0, 59));

                $status = rand(0, 1) ? AppointmentStatus::CONFIRMED : AppointmentStatus::PENDING;
                $confirmedAt = $status === AppointmentStatus::CONFIRMED 
                    ? Carbon::now()->subDays(rand(1, 3)) 
                    : null;

                $appointment = Appointment::create([
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'scheduled_at' => $scheduledAt,
                    'status' => $status,
                    'type' => 'CONSULTATION',
                    'duration_minutes' => 30,
                    'notes' => null,
                    'price' => $price,
                    'confirmed_at' => $confirmedAt,
                    'completed_at' => null,
                    'created_by' => $admin?->id,
                    'created_at' => Carbon::now()->subDays(rand(1, 14)),
                    'updated_at' => Carbon::now(),
                ]);

                AppointmentLog::create([
                    'appointment_id' => $appointment->id,
                    'old_status' => null,
                    'new_status' => $status,
                    'changed_by' => $admin?->id,
                    'changed_at' => $appointment->created_at,
                    'reason' => 'Consulta futura agendada',
                ]);
            }
        }

        $totalAppointments = Appointment::count();
        $completed = Appointment::where('status', AppointmentStatus::COMPLETED)->count();
        $cancelled = Appointment::where('status', AppointmentStatus::CANCELLED)->count();
        $noShow = Appointment::where('status', AppointmentStatus::NO_SHOW)->count();
        $totalRevenue = Appointment::where('status', AppointmentStatus::COMPLETED)->sum('price');

        $this->command->info("Dados de demonstracao criados com sucesso!");
        $this->command->info("Total de consultas: {$totalAppointments}");
        $this->command->info("Realizadas: {$completed} | Canceladas: {$cancelled} | No-Show: {$noShow}");
        $this->command->info("Receita total: R$ " . number_format($totalRevenue, 2, ',', '.'));
    }

    private function getRandomNote(?AppointmentStatus $status): ?string
    {
        if ($status === AppointmentStatus::CANCELLED) {
            $reasons = [
                'Paciente solicitou cancelamento',
                'Conflito de horario',
                'Paciente doente',
                'Viagem de emergencia',
                'Problemas pessoais',
                'Remarcacao solicitada',
                null,
            ];
            return $reasons[array_rand($reasons)];
        }

        if ($status === AppointmentStatus::NO_SHOW) {
            return 'Paciente nao compareceu';
        }

        if ($status === AppointmentStatus::COMPLETED) {
            $notes = [
                'Consulta de rotina realizada',
                'Retorno agendado',
                'Exames solicitados',
                'Prescricao emitida',
                null,
                null,
            ];
            return $notes[array_rand($notes)];
        }

        return null;
    }
}

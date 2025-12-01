<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Schedule;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TestDoctorSchedulesSeeder extends Seeder
{
    /**
     * Cria agendas de atendimento para os médicos existentes
     * para permitir testes de agendamento de consultas.
     */
    public function run(): void
    {
        $doctors = Doctor::all();

        if ($doctors->isEmpty()) {
            $this->command->warn('Nenhum médico encontrado. Execute o seeder de médicos primeiro.');
            return;
        }

        $this->command->info('Configurando agendas para ' . $doctors->count() . ' médicos...');

        foreach ($doctors as $doctor) {
            // Remove agendas antigas (incluindo soft deleted)
            Schedule::withTrashed()->where('doctor_id', $doctor->id)->forceDelete();

            // Configura diferentes horários para cada médico para variedade
            $scheduleConfigs = $this->getScheduleConfigForDoctor($doctor->id);

            foreach ($scheduleConfigs as $config) {
                Schedule::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $config['day_of_week'],
                    'start_time' => $config['start_time'],
                    'end_time' => $config['end_time'],
                    'slot_duration_minutes' => $config['slot_duration'] ?? 30,
                    'is_blocked' => false,
                ]);
            }

            $this->command->info("  ✓ {$doctor->name} - " . count($scheduleConfigs) . " horários configurados");
        }

        $this->command->info('');
        $this->command->info('Agendas configuradas com sucesso!');
        $this->command->info('Os médicos agora têm horários disponíveis para agendamento.');
    }

    /**
     * Retorna configuração de agenda baseada no ID do médico
     * para criar variedade nos horários.
     */
    private function getScheduleConfigForDoctor(int $doctorId): array
    {
        // Alterna entre diferentes configurações baseado no ID
        $configIndex = $doctorId % 4;

        return match ($configIndex) {
            // Config 1: Segunda a Sexta, manhã e tarde
            0 => [
                // Segunda
                ['day_of_week' => 1, 'start_time' => '08:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 1, 'start_time' => '14:00', 'end_time' => '18:00', 'slot_duration' => 30],
                // Terça
                ['day_of_week' => 2, 'start_time' => '08:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 2, 'start_time' => '14:00', 'end_time' => '18:00', 'slot_duration' => 30],
                // Quarta
                ['day_of_week' => 3, 'start_time' => '08:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 3, 'start_time' => '14:00', 'end_time' => '18:00', 'slot_duration' => 30],
                // Quinta
                ['day_of_week' => 4, 'start_time' => '08:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 4, 'start_time' => '14:00', 'end_time' => '18:00', 'slot_duration' => 30],
                // Sexta
                ['day_of_week' => 5, 'start_time' => '08:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 5, 'start_time' => '14:00', 'end_time' => '17:00', 'slot_duration' => 30],
            ],

            // Config 2: Segunda, Quarta e Sexta - tarde e noite
            1 => [
                // Segunda
                ['day_of_week' => 1, 'start_time' => '13:00', 'end_time' => '17:00', 'slot_duration' => 30],
                ['day_of_week' => 1, 'start_time' => '18:00', 'end_time' => '21:00', 'slot_duration' => 30],
                // Quarta
                ['day_of_week' => 3, 'start_time' => '13:00', 'end_time' => '17:00', 'slot_duration' => 30],
                ['day_of_week' => 3, 'start_time' => '18:00', 'end_time' => '21:00', 'slot_duration' => 30],
                // Sexta
                ['day_of_week' => 5, 'start_time' => '13:00', 'end_time' => '17:00', 'slot_duration' => 30],
                ['day_of_week' => 5, 'start_time' => '18:00', 'end_time' => '21:00', 'slot_duration' => 30],
            ],

            // Config 3: Terça, Quinta e Sábado - manhã
            2 => [
                // Terça
                ['day_of_week' => 2, 'start_time' => '07:00', 'end_time' => '12:00', 'slot_duration' => 30],
                // Quinta
                ['day_of_week' => 4, 'start_time' => '07:00', 'end_time' => '12:00', 'slot_duration' => 30],
                // Sábado
                ['day_of_week' => 6, 'start_time' => '08:00', 'end_time' => '13:00', 'slot_duration' => 30],
            ],

            // Config 4: Todos os dias úteis, horário comercial
            3 => [
                // Segunda
                ['day_of_week' => 1, 'start_time' => '09:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 1, 'start_time' => '13:00', 'end_time' => '17:00', 'slot_duration' => 30],
                // Terça
                ['day_of_week' => 2, 'start_time' => '09:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 2, 'start_time' => '13:00', 'end_time' => '17:00', 'slot_duration' => 30],
                // Quarta
                ['day_of_week' => 3, 'start_time' => '09:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 3, 'start_time' => '13:00', 'end_time' => '17:00', 'slot_duration' => 30],
                // Quinta
                ['day_of_week' => 4, 'start_time' => '09:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 4, 'start_time' => '13:00', 'end_time' => '17:00', 'slot_duration' => 30],
                // Sexta
                ['day_of_week' => 5, 'start_time' => '09:00', 'end_time' => '12:00', 'slot_duration' => 30],
                ['day_of_week' => 5, 'start_time' => '13:00', 'end_time' => '16:00', 'slot_duration' => 30],
            ],

            default => [],
        };
    }
}

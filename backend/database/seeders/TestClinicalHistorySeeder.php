<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Observation;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TestClinicalHistorySeeder extends Seeder
{
    public function run(): void
    {
        // Buscar o paciente Daniel Battisti
        $user = User::where('email', 'danielbattisti@outlook.com.br')->first();
        
        if (!$user) {
            $this->command->warn('Usuário danielbattisti@outlook.com.br não encontrado.');
            return;
        }
        
        $patient = Patient::where('user_id', $user->id)->first();
        
        if (!$patient) {
            $this->command->warn('Paciente não encontrado para o usuário.');
            return;
        }

        $doctors = Doctor::with('user')->take(3)->get();
        
        if ($doctors->isEmpty()) {
            $this->command->warn('Nenhum médico encontrado.');
            return;
        }

        $this->command->info("Criando histórico clínico para: {$user->name}");

        // Consultas passadas (completadas)
        $pastAppointments = [
            [
                'doctor_id' => $doctors[0]->id, // Clínico Geral
                'scheduled_at' => Carbon::now()->subMonths(6)->setTime(9, 0),
                'status' => AppointmentStatus::COMPLETED,
                'type' => 'PRESENTIAL',
                'notes' => 'Check-up anual',
                'observation' => [
                    'anamnesis' => 'Paciente relata estar se sentindo bem. Sem queixas específicas. Nega dores, febre ou outros sintomas. Alimentação regular, pratica atividade física 3x por semana.',
                    'diagnosis' => 'Paciente saudável. Exames de rotina dentro da normalidade.',
                    'prescription' => 'Manter hábitos saudáveis. Retornar em 1 ano para novo check-up.',
                    'notes' => 'Solicitados exames de sangue completo, glicemia, colesterol.',
                ],
            ],
            [
                'doctor_id' => $doctors[0]->id, // Clínico Geral
                'scheduled_at' => Carbon::now()->subMonths(4)->setTime(14, 30),
                'status' => AppointmentStatus::COMPLETED,
                'type' => 'PRESENTIAL',
                'notes' => 'Dor de garganta persistente',
                'observation' => [
                    'anamnesis' => 'Paciente queixa-se de dor de garganta há 3 dias, com dificuldade para engolir. Apresenta febre baixa (37.8°C). Nega tosse ou coriza.',
                    'diagnosis' => 'Faringite bacteriana',
                    'prescription' => "Amoxicilina 500mg - 1 comprimido de 8/8h por 7 dias\nIbuprofeno 400mg - 1 comprimido de 8/8h se dor ou febre\nPastilhas para garganta - usar conforme necessidade",
                    'notes' => 'Orientado repouso e hidratação. Retornar se não melhorar em 5 dias.',
                ],
            ],
            [
                'doctor_id' => $doctors[1]->id, // Cardiologista
                'scheduled_at' => Carbon::now()->subMonths(3)->setTime(10, 0),
                'status' => AppointmentStatus::COMPLETED,
                'type' => 'PRESENTIAL',
                'notes' => 'Avaliação cardiológica - encaminhamento do clínico',
                'observation' => [
                    'anamnesis' => 'Paciente encaminhado para avaliação cardiológica de rotina. Nega dor torácica, palpitações ou falta de ar. Histórico familiar: pai hipertenso.',
                    'diagnosis' => 'Coração estruturalmente normal. ECG sem alterações. Pressão arterial limítrofe (130x85mmHg).',
                    'prescription' => "Reduzir consumo de sal\nManter atividade física regular\nMonitorar pressão arterial semanalmente",
                    'notes' => 'Solicitado ecocardiograma e teste ergométrico. Retornar com resultados em 30 dias.',
                ],
            ],
            [
                'doctor_id' => $doctors[0]->id, // Clínico Geral
                'scheduled_at' => Carbon::now()->subMonths(2)->setTime(11, 0),
                'status' => AppointmentStatus::COMPLETED,
                'type' => 'TELEMEDICINE',
                'notes' => 'Retorno - resultados de exames',
                'observation' => [
                    'anamnesis' => 'Retorno para avaliação de exames solicitados. Paciente assintomático.',
                    'diagnosis' => 'Exames laboratoriais normais. Ecocardiograma normal. Teste ergométrico: boa capacidade funcional.',
                    'prescription' => 'Manter medicações e hábitos atuais.',
                    'notes' => 'Paciente orientado. Liberado para atividades físicas sem restrições.',
                ],
            ],
            [
                'doctor_id' => $doctors[0]->id, // Clínico Geral
                'scheduled_at' => Carbon::now()->subWeeks(3)->setTime(15, 0),
                'status' => AppointmentStatus::COMPLETED,
                'type' => 'PRESENTIAL',
                'notes' => 'Dor lombar',
                'observation' => [
                    'anamnesis' => 'Paciente refere dor lombar há 1 semana, iniciada após carregar peso. Dor piora ao ficar muito tempo sentado. Nega irradiação para membros inferiores.',
                    'diagnosis' => 'Lombalgia mecânica - contratura muscular',
                    'prescription' => "Ciclobenzaprina 5mg - 1 comprimido à noite por 7 dias\nDiclofenaco 50mg - 1 comprimido de 12/12h por 5 dias\nCompressas mornas na região lombar",
                    'notes' => 'Orientado alongamentos e correção postural. Encaminhado para fisioterapia se não melhorar.',
                ],
            ],
        ];

        // Consulta cancelada
        $cancelledAppointment = [
            'doctor_id' => $doctors[2]->id,
            'scheduled_at' => Carbon::now()->subWeeks(1)->setTime(9, 0),
            'status' => AppointmentStatus::CANCELLED,
            'type' => 'PRESENTIAL',
            'notes' => 'Consulta de rotina - cancelada pelo paciente',
            'observation' => null,
        ];

        // Consultas futuras (pendentes/confirmadas)
        $futureAppointments = [
            [
                'doctor_id' => $doctors[0]->id,
                'scheduled_at' => Carbon::now()->addDays(3)->setTime(10, 0),
                'status' => AppointmentStatus::CONFIRMED,
                'type' => 'PRESENTIAL',
                'notes' => 'Retorno - acompanhamento lombalgia',
                'observation' => null,
            ],
            [
                'doctor_id' => $doctors[1]->id,
                'scheduled_at' => Carbon::now()->addDays(5)->setTime(14, 0),
                'status' => AppointmentStatus::PENDING,
                'type' => 'PRESENTIAL',
                'notes' => 'Check-up cardiológico anual',
                'observation' => null,
            ],
            [
                'doctor_id' => $doctors[0]->id,
                'scheduled_at' => Carbon::now()->addDays(7)->setTime(9, 30),
                'status' => AppointmentStatus::CONFIRMED,
                'type' => 'TELEMEDICINE',
                'notes' => 'Consulta online - acompanhamento',
                'observation' => null,
            ],
            [
                'doctor_id' => $doctors[2]->id,
                'scheduled_at' => Carbon::now()->addDays(10)->setTime(11, 0),
                'status' => AppointmentStatus::PENDING,
                'type' => 'PRESENTIAL',
                'notes' => 'Primeira consulta - avaliação geral',
                'observation' => null,
            ],
            [
                'doctor_id' => $doctors[1]->id,
                'scheduled_at' => Carbon::now()->addDays(14)->setTime(15, 30),
                'status' => AppointmentStatus::CONFIRMED,
                'type' => 'PRESENTIAL',
                'notes' => 'Retorno com exames - cardiologia',
                'observation' => null,
            ],
            [
                'doctor_id' => $doctors[0]->id,
                'scheduled_at' => Carbon::now()->addDays(21)->setTime(16, 0),
                'status' => AppointmentStatus::PENDING,
                'type' => 'PRESENTIAL',
                'notes' => 'Consulta de rotina mensal',
                'observation' => null,
            ],
        ];

        // Criar consultas passadas com observações
        foreach ($pastAppointments as $data) {
            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $data['doctor_id'],
                'scheduled_at' => $data['scheduled_at'],
                'duration_minutes' => 30,
                'status' => $data['status'],
                'type' => $data['type'],
                'price' => rand(150, 300),
                'notes' => $data['notes'],
                'confirmed_at' => $data['scheduled_at']->copy()->subDays(2),
                'completed_at' => $data['scheduled_at']->copy()->addMinutes(25),
                'created_by' => $user->id,
            ]);

            if ($data['observation']) {
                Observation::create([
                    'appointment_id' => $appointment->id,
                    'doctor_id' => $data['doctor_id'],
                    'patient_id' => $patient->id,
                    'anamnesis' => $data['observation']['anamnesis'],
                    'diagnosis' => $data['observation']['diagnosis'],
                    'prescription' => $data['observation']['prescription'],
                    'notes' => $data['observation']['notes'],
                ]);
            }

            $doctor = $doctors->firstWhere('id', $data['doctor_id']);
            $this->command->info("✓ Consulta criada: {$data['scheduled_at']->format('d/m/Y H:i')} - Dr(a). {$doctor->user->name} ({$data['type']})");
        }

        // Criar consulta cancelada
        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $cancelledAppointment['doctor_id'],
            'scheduled_at' => $cancelledAppointment['scheduled_at'],
            'duration_minutes' => 30,
            'status' => $cancelledAppointment['status'],
            'type' => $cancelledAppointment['type'],
            'price' => 180,
            'notes' => $cancelledAppointment['notes'],
            'cancelled_at' => $cancelledAppointment['scheduled_at']->copy()->subDays(1),
            'created_by' => $user->id,
        ]);
        $this->command->info("✓ Consulta cancelada criada");

        // Criar consultas futuras
        foreach ($futureAppointments as $data) {
            Appointment::create([
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
            $statusLabel = $data['status'] === AppointmentStatus::CONFIRMED ? 'Confirmada' : 'Pendente';
            $this->command->info("✓ Consulta futura: {$data['scheduled_at']->format('d/m/Y H:i')} - Dr(a). {$doctor->user->name} ({$statusLabel})");
        }

        $this->command->info('');
        $this->command->info('Histórico clínico criado com sucesso!');
        $this->command->info('- 5 consultas passadas (com observações médicas)');
        $this->command->info('- 1 consulta cancelada');
        $this->command->info('- 6 consultas futuras (3 confirmadas, 3 pendentes)');
    }
}

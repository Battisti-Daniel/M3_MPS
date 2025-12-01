<?php

namespace Database\Seeders;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\Gender;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\Doctor;
use App\Models\HealthInsurance;
use App\Models\Notification;
use App\Models\Observation;
use App\Models\Patient;
use App\Models\Schedule;
use App\Models\ScheduleBlock;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RealisticDemoDataSeeder extends Seeder
{
    private array $specialties = [
        'Cardiologia',
        'Dermatologia',
        'Clínico Geral',
        'Pediatria',
        'Ortopedia',
    ];

    private array $doctorNames = [
        'Cardiologia' => ['Dr. Ricardo Mendes', 'Dra. Fernanda Costa'],
        'Dermatologia' => ['Dra. Juliana Almeida', 'Dr. Bruno Ferreira'],
        'Clínico Geral' => ['Dr. Carlos Eduardo Silva', 'Dra. Mariana Santos'],
        'Pediatria' => ['Dra. Ana Paula Ribeiro', 'Dr. Pedro Henrique Lima'],
        'Ortopedia' => ['Dr. Gustavo Oliveira', 'Dra. Patrícia Souza'],
    ];

    private array $patientNames = [
        ['Maria Aparecida Santos', 'F'],
        ['José Carlos Oliveira', 'M'],
        ['Ana Paula da Silva', 'F'],
        ['Francisco de Assis', 'M'],
        ['Margarida Flores Costa', 'F'],
        ['Antônio Roberto Lima', 'M'],
        ['Luzia Marta Pereira', 'F'],
        ['Sebastião Alves Neto', 'M'],
        ['Tereza Cristina Machado', 'F'],
        ['João Batista Ferreira', 'M'],
        ['Francisca Helena Souza', 'F'],
        ['Pedro Paulo Martins', 'M'],
        ['Rosa Maria Campos', 'F'],
        ['Joaquim Silveira', 'M'],
        ['Lúcia Aparecida Rocha', 'F'],
        ['Manoel Correia', 'M'],
        ['Cláudia Regina Dias', 'F'],
        ['Paulo César Mendonça', 'M'],
        ['Sandra Melo Vieira', 'F'],
        ['Roberto Carlos Andrade', 'M'],
    ];

    private array $cancellationReasons = [
        'Compromisso de trabalho surgiu',
        'Problema de saúde na família',
        'Não consegui transporte',
        'Médico precisou remarcar',
        'Emergência pessoal',
        'Viagem inesperada',
        'Esqueci do compromisso',
        'Melhora dos sintomas',
    ];

    private array $observations = [
        'Cardiologia' => [
            'anamnese' => 'Paciente relata dor torácica esporádica há 2 semanas, piora aos esforços. Nega dispneia em repouso. HAS há 5 anos, em uso de Losartana 50mg.',
            'diagnosis' => 'Angina estável CCS II. Hipertensão arterial sistêmica controlada.',
            'prescription' => 'Manter Losartana 50mg 1x/dia. Iniciar AAS 100mg 1x/dia. Solicitar teste ergométrico.',
        ],
        'Dermatologia' => [
            'anamnese' => 'Paciente com manchas avermelhadas em região facial há 3 meses. Piora com exposição solar. Uso de protetor solar irregular.',
            'diagnosis' => 'Melasma facial grau moderado.',
            'prescription' => 'Protetor solar FPS 50 aplicar 3x/dia. Hidroquinona 4% à noite. Retorno em 60 dias.',
        ],
        'Clínico Geral' => [
            'anamnese' => 'Check-up de rotina. Paciente assintomático. Nega doenças crônicas. Última consulta há 1 ano.',
            'diagnosis' => 'Paciente hígido. Sobrepeso leve (IMC 26).',
            'prescription' => 'Orientação nutricional. Atividade física regular 30min/dia. Exames laboratoriais de rotina.',
        ],
        'Pediatria' => [
            'anamnese' => 'Criança de 5 anos com febre há 2 dias, tosse produtiva e coriza. Alimentação preservada.',
            'diagnosis' => 'Infecção de vias aéreas superiores.',
            'prescription' => 'Paracetamol gotas se febre. Lavagem nasal com SF. Retorno se piora ou febre persistente > 72h.',
        ],
        'Ortopedia' => [
            'anamnese' => 'Dor em joelho direito há 1 mês, piora ao subir escadas. Nega trauma. Pratica caminhada 3x/semana.',
            'diagnosis' => 'Condropatia patelar grau I-II.',
            'prescription' => 'Fisioterapia 2x/semana. Anti-inflamatório por 7 dias. Evitar atividades de impacto.',
        ],
    ];

    public function run(): void
    {
        $this->command->info('🏥 Iniciando geração de dados realistas para demonstração...');
        
        // Limpar dados existentes
        $this->cleanExistingData();
        
        // Criar convênios
        $insurances = $this->createHealthInsurances();
        $this->command->info('✓ Convênios criados');
        
        // Criar médicos
        $doctors = $this->createDoctors($insurances);
        $this->command->info('✓ Médicos criados: ' . count($doctors));
        
        // Criar horários dos médicos
        $this->createSchedules($doctors);
        $this->command->info('✓ Horários de atendimento configurados');
        
        // Criar pacientes
        $patients = $this->createPatients($insurances);
        $this->command->info('✓ Pacientes criados: ' . count($patients));
        
        // Criar consultas históricas e futuras
        $appointments = $this->createAppointments($doctors, $patients);
        $this->command->info('✓ Consultas criadas: ' . count($appointments));
        
        // Adicionar remarcações realísticas (cerca de 15% das consultas)
        $rescheduledCount = $this->addRescheduleLogs($appointments);
        $this->command->info('✓ Remarcações adicionadas: ' . $rescheduledCount);
        
        // Criar observações para consultas completadas
        $this->createObservations($appointments);
        $this->command->info('✓ Observações médicas registradas');
        
        // Criar notificações realistas
        $this->createNotifications($appointments);
        $this->command->info('✓ Notificações criadas');
        
        // Criar bloqueios de agenda
        $this->createScheduleBlocks($doctors);
        $this->command->info('✓ Bloqueios de agenda criados');
        
        $this->command->info('');
        $this->command->info('📊 Resumo dos dados criados:');
        $this->command->info("   • Convênios: " . count($insurances));
        $this->command->info("   • Médicos: " . count($doctors));
        $this->command->info("   • Pacientes: " . count($patients));
        $this->command->info("   • Consultas: " . count($appointments));
        $this->command->info("   • Remarcações: " . $rescheduledCount);
        $this->command->info('');
        $this->command->info('✅ Dados de demonstração criados com sucesso!');
    }

    private function cleanExistingData(): void
    {
        $this->command->info('Limpando dados existentes...');
        
        // Identificar admin
        $adminUser = User::where('email', 'danielbattisti@outlook.com.br')->first();
        $adminId = $adminUser?->id;
        
        // Remover dados relacionados
        Notification::query()->delete();
        Observation::query()->delete();
        AppointmentLog::query()->delete();
        Appointment::query()->delete();
        ScheduleBlock::query()->delete();
        Schedule::query()->delete();
        
        // Remover vínculos de convênios de pacientes
        \DB::table('patient_health_insurance')->delete();
        \DB::table('doctor_health_insurance')->delete();
        
        // Remover pacientes (exceto o admin)
        Patient::when($adminId, fn($q) => $q->where('user_id', '!=', $adminId))->delete();
        
        // Remover médicos e seus usuários
        $doctorUserIds = Doctor::pluck('user_id')->toArray();
        Doctor::query()->delete();
        if (!empty($doctorUserIds)) {
            User::whereIn('id', $doctorUserIds)->forceDelete();
        }
        
        // Remover usuários pacientes (exceto admin)
        User::where('role', UserRole::PATIENT)
            ->when($adminId, fn($q) => $q->where('id', '!=', $adminId))
            ->forceDelete();
    }

    private function createHealthInsurances(): array
    {
        $insurances = [
            ['name' => 'Unimed', 'description' => 'Cooperativa médica nacional'],
            ['name' => 'Bradesco Saúde', 'description' => 'Plano de saúde Bradesco'],
            ['name' => 'SulAmérica', 'description' => 'SulAmérica Seguros e Saúde'],
            ['name' => 'Amil', 'description' => 'Planos de saúde Amil'],
            ['name' => 'Particular', 'description' => 'Atendimento particular sem convênio'],
        ];

        $created = [];
        foreach ($insurances as $data) {
            $created[] = HealthInsurance::updateOrCreate(
                ['name' => $data['name']],
                ['description' => $data['description'], 'coverage_percentage' => 80, 'is_active' => true]
            );
        }

        return $created;
    }

    private function createDoctors(array $insurances): array
    {
        $doctors = [];
        $crmCounter = 100000;

        foreach ($this->doctorNames as $specialty => $names) {
            foreach ($names as $name) {
                $email = $this->generateEmail($name);
                
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'phone' => $this->generatePhone(),
                    'password' => Hash::make('Senha@123'),
                    'role' => UserRole::DOCTOR,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);

                $doctor = Doctor::create([
                    'user_id' => $user->id,
                    'crm' => 'CRM-' . $crmCounter++ . '-SC',
                    'specialty' => $specialty,
                    'qualification' => "Especialista em {$specialty} com mais de 10 anos de experiência.",
                    'is_active' => true,
                ]);

                // Associar convênios aleatórios
                $insuranceIds = collect($insurances)->random(rand(3, 5))->pluck('id');
                $doctor->healthInsurances()->attach($insuranceIds);

                $doctors[] = $doctor;
            }
        }

        return $doctors;
    }

    private function createSchedules(array $doctors): void
    {
        foreach ($doctors as $doctor) {
            // Segunda a Sexta, 8h-12h e 14h-18h
            for ($day = 1; $day <= 5; $day++) {
                Schedule::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => '08:00',
                    'end_time' => '12:00',
                    'slot_duration_minutes' => 30,
                    'is_blocked' => false,
                ]);
                
                Schedule::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => '14:00',
                    'end_time' => '18:00',
                    'slot_duration_minutes' => 30,
                    'is_blocked' => false,
                ]);
            }
        }
    }

    private function createPatients(array $insurances): array
    {
        $patients = [];
        
        // Manter o paciente admin se existir
        $adminUser = User::where('email', 'danielbattisti@outlook.com.br')->first();
        if ($adminUser) {
            $adminPatient = Patient::where('user_id', $adminUser->id)->first();
            if ($adminPatient) {
                $patients[] = $adminPatient;
            }
        }

        foreach ($this->patientNames as $index => [$name, $gender]) {
            $email = $this->generateEmail($name);
            
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'phone' => $this->generatePhone(),
                'password' => Hash::make('Senha@123'),
                'role' => UserRole::PATIENT,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $patient = Patient::create([
                'user_id' => $user->id,
                'cpf' => $this->generateCPF(),
                'birth_date' => now()->subYears(rand(20, 70))->subDays(rand(1, 365)),
                'gender' => $gender === 'M' ? Gender::MALE : Gender::FEMALE,
                'address' => 'Rua ' . fake()->streetName() . ', ' . rand(1, 999) . ' - Florianópolis/SC',
                'consecutive_no_shows' => 0,
                'is_blocked' => false,
            ]);

            // Associar convênio
            $insurance = $insurances[array_rand($insurances)];
            $patient->healthInsurances()->attach($insurance->id, [
                'policy_number' => strtoupper(fake()->bothify('???######')),
                'is_active' => true,
            ]);

            $patients[] = $patient;
        }

        return $patients;
    }

    private function createAppointments(array $doctors, array $patients): array
    {
        $appointments = [];
        $prices = [150, 180, 200, 220, 250, 280, 300, 350];
        $doctorSlots = []; // Track doctor slots to avoid conflicts
        $patientSlots = []; // Track patient slots to avoid conflicts
        
        // Criar consultas nos últimos 3 meses
        for ($daysAgo = 90; $daysAgo >= 1; $daysAgo--) {
            $date = now()->subDays($daysAgo);
            
            // Pular finais de semana
            if ($date->isWeekend()) continue;
            
            // 3-8 consultas por dia
            $appointmentsPerDay = rand(3, 8);
            
            for ($i = 0; $i < $appointmentsPerDay; $i++) {
                $doctor = $doctors[array_rand($doctors)];
                $patient = $patients[array_rand($patients)];
                
                // Find an available slot for this doctor and patient
                $scheduledAt = null;
                $attempts = 0;
                
                while (!$scheduledAt && $attempts < 16) {
                    $hour = $attempts < 8 ? rand(8, 11) : rand(14, 17);
                    $minute = [0, 30][array_rand([0, 30])];
                    $testTime = $date->copy()->setTime($hour, $minute);
                    $dateTimeStr = $testTime->format('Y-m-d H:i');
                    $doctorKey = $doctor->id . '_' . $dateTimeStr;
                    $patientKey = $patient->id . '_' . $dateTimeStr;
                    
                    if (!isset($doctorSlots[$doctorKey]) && !isset($patientSlots[$patientKey])) {
                        $scheduledAt = $testTime;
                        $doctorSlots[$doctorKey] = true;
                        $patientSlots[$patientKey] = true;
                    }
                    $attempts++;
                }
                
                if (!$scheduledAt) continue; // Skip if no slot found
                
                // Determinar status baseado na data
                $status = $this->determineStatus($scheduledAt);
                $reason = null;
                
                if ($status === AppointmentStatus::CANCELLED) {
                    $reason = $this->cancellationReasons[array_rand($this->cancellationReasons)];
                }
                
                $appointment = Appointment::create([
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'scheduled_at' => $scheduledAt,
                    'status' => $status,
                    'notes' => $reason,
                    'price' => $prices[array_rand($prices)],
                    'confirmed_at' => in_array($status, [AppointmentStatus::CONFIRMED, AppointmentStatus::COMPLETED]) 
                        ? $scheduledAt->copy()->subDays(rand(1, 3)) 
                        : null,
                ]);

                // Criar log inicial
                AppointmentLog::create([
                    'appointment_id' => $appointment->id,
                    'old_status' => null,
                    'new_status' => AppointmentStatus::PENDING,
                    'changed_by' => $patient->user_id,
                    'reason' => 'Agendamento inicial',
                    'changed_at' => $scheduledAt->copy()->subDays(rand(3, 7)),
                ]);

                // Log de status final se não for pending
                if ($status !== AppointmentStatus::PENDING) {
                    AppointmentLog::create([
                        'appointment_id' => $appointment->id,
                        'old_status' => AppointmentStatus::PENDING,
                        'new_status' => $status,
                        'changed_by' => $status === AppointmentStatus::CANCELLED ? $patient->user_id : $doctor->user_id,
                        'reason' => $reason ?? match($status) {
                            AppointmentStatus::COMPLETED => 'Consulta realizada',
                            AppointmentStatus::CONFIRMED => 'Paciente confirmou presença',
                            AppointmentStatus::NO_SHOW => 'Paciente não compareceu',
                            default => null,
                        },
                        'changed_at' => $scheduledAt,
                    ]);
                }

                $appointments[] = $appointment;
            }
        }

        // Criar consultas futuras (próximos 14 dias)
        for ($daysAhead = 1; $daysAhead <= 14; $daysAhead++) {
            $date = now()->addDays($daysAhead);
            
            if ($date->isWeekend()) continue;
            
            $appointmentsPerDay = rand(4, 10);
            
            for ($i = 0; $i < $appointmentsPerDay; $i++) {
                $doctor = $doctors[array_rand($doctors)];
                $patient = $patients[array_rand($patients)];
                
                // Find an available slot for this doctor and patient
                $scheduledAt = null;
                $attempts = 0;
                
                while (!$scheduledAt && $attempts < 16) {
                    $hour = $attempts < 8 ? rand(8, 11) : rand(14, 17);
                    $minute = [0, 30][array_rand([0, 30])];
                    $testTime = $date->copy()->setTime($hour, $minute);
                    $dateTimeStr = $testTime->format('Y-m-d H:i');
                    $doctorKey = $doctor->id . '_' . $dateTimeStr;
                    $patientKey = $patient->id . '_' . $dateTimeStr;
                    
                    if (!isset($doctorSlots[$doctorKey]) && !isset($patientSlots[$patientKey])) {
                        $scheduledAt = $testTime;
                        $doctorSlots[$doctorKey] = true;
                        $patientSlots[$patientKey] = true;
                    }
                    $attempts++;
                }
                
                if (!$scheduledAt) continue; // Skip if no slot found
                
                $status = rand(1, 100) <= 70 ? AppointmentStatus::CONFIRMED : AppointmentStatus::PENDING;
                
                $appointment = Appointment::create([
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'scheduled_at' => $scheduledAt,
                    'status' => $status,
                    'price' => $prices[array_rand($prices)],
                    'confirmed_at' => $status === AppointmentStatus::CONFIRMED ? now() : null,
                ]);

                AppointmentLog::create([
                    'appointment_id' => $appointment->id,
                    'old_status' => null,
                    'new_status' => AppointmentStatus::PENDING,
                    'changed_by' => $patient->user_id,
                    'reason' => 'Agendamento inicial',
                    'changed_at' => now()->subDays(rand(1, 5)),
                ]);

                $appointments[] = $appointment;
            }
        }

        return $appointments;
    }

    private function determineStatus(Carbon $scheduledAt): AppointmentStatus
    {
        // Consultas passadas
        if ($scheduledAt->isPast()) {
            $rand = rand(1, 100);
            if ($rand <= 75) return AppointmentStatus::COMPLETED;
            if ($rand <= 85) return AppointmentStatus::CANCELLED;
            if ($rand <= 95) return AppointmentStatus::NO_SHOW;
            return AppointmentStatus::CONFIRMED; // Algumas confirmadas mas não finalizadas
        }
        
        return AppointmentStatus::PENDING;
    }

    private function addRescheduleLogs(array $appointments): int
    {
        $rescheduleReasons = [
            'Paciente solicitou remarcação por motivo pessoal',
            'Médico precisou remarcar consulta',
            'Conflito de agenda do paciente',
            'Paciente solicitou novo horário',
            'Reagendamento por conveniência',
            'Paciente remarcou para outro dia',
        ];

        $count = 0;
        $appointmentsToReschedule = collect($appointments)
            ->filter(fn($a) => in_array($a->status, [
                AppointmentStatus::COMPLETED,
                AppointmentStatus::CONFIRMED,
                AppointmentStatus::PENDING,
            ]))
            ->random(min(60, (int)(count($appointments) * 0.15))); // 15% das consultas

        foreach ($appointmentsToReschedule as $appointment) {
            // Adicionar log de remarcação
            AppointmentLog::create([
                'appointment_id' => $appointment->id,
                'old_status' => AppointmentStatus::PENDING,
                'new_status' => AppointmentStatus::PENDING,
                'changed_by' => $appointment->patient->user_id,
                'reason' => $rescheduleReasons[array_rand($rescheduleReasons)],
                'metadata' => ['action' => 'rescheduled', 'old_date' => $appointment->scheduled_at->subDays(rand(1, 5))->toDateTimeString()],
                'changed_at' => $appointment->scheduled_at->subDays(rand(2, 7)),
            ]);
            $count++;
        }

        return $count;
    }

    private function createObservations(array $appointments): void
    {
        foreach ($appointments as $appointment) {
            if ($appointment->status !== AppointmentStatus::COMPLETED) continue;
            
            $specialty = $appointment->doctor->specialty;
            $template = $this->observations[$specialty] ?? $this->observations['Clínico Geral'];
            
            Observation::create([
                'appointment_id' => $appointment->id,
                'doctor_id' => $appointment->doctor_id,
                'patient_id' => $appointment->patient_id,
                'anamnesis' => $template['anamnese'],
                'diagnosis' => $template['diagnosis'],
                'prescription' => $template['prescription'],
                'notes' => rand(1, 10) <= 3 ? 'Paciente orientado sobre retorno.' : null,
            ]);
        }
    }

    private function createNotifications($appointments): void
    {
        $dispatcher = app(NotificationDispatcher::class);
        
        // Pegar consultas futuras para criar notificações
        $futureAppointments = collect($appointments)
            ->filter(fn($a) => $a->scheduled_at->isFuture())
            ->take(20);

        foreach ($futureAppointments as $appointment) {
            $appointment->loadMissing(['patient.user', 'doctor.user']);
            
            // Notificação de confirmação
            if ($appointment->status === AppointmentStatus::CONFIRMED) {
                $dispatcher->dispatchFromTemplate(
                    $appointment->patient->user,
                    'appointment_confirmed_patient',
                    [
                        'patient' => $appointment->patient->user->name,
                        'doctor' => $appointment->doctor->user->name,
                        'date' => $appointment->scheduled_at->format('d/m/Y'),
                        'time' => $appointment->scheduled_at->format('H:i'),
                    ],
                    metadata: ['appointment_id' => $appointment->id]
                );
            }
            
            // Lembrete para consultas nos próximos 2 dias
            if ($appointment->scheduled_at->diffInDays(now()) <= 2) {
                $dispatcher->dispatchFromTemplate(
                    $appointment->patient->user,
                    'appointment_reminder_patient',
                    [
                        'patient' => $appointment->patient->user->name,
                        'doctor' => $appointment->doctor->user->name,
                        'date' => $appointment->scheduled_at->format('d/m/Y'),
                        'time' => $appointment->scheduled_at->format('H:i'),
                    ],
                    metadata: ['appointment_id' => $appointment->id]
                );
            }
        }

        // Pegar algumas consultas canceladas para notificação
        $cancelledAppointments = collect($appointments)
            ->filter(fn($a) => $a->status === AppointmentStatus::CANCELLED)
            ->take(5);

        foreach ($cancelledAppointments as $appointment) {
            $appointment->loadMissing(['patient.user', 'doctor.user']);
            
            $dispatcher->dispatchFromTemplate(
                $appointment->patient->user,
                'appointment_cancelled_patient',
                [
                    'patient' => $appointment->patient->user->name,
                    'doctor' => $appointment->doctor->user->name,
                    'reason' => $appointment->notes ?? 'Não informado',
                ],
                metadata: ['appointment_id' => $appointment->id]
            );
        }
    }

    private function createScheduleBlocks(array $doctors): void
    {
        // Criar alguns bloqueios de agenda
        $reasons = [
            'Congresso Médico',
            'Férias',
            'Reunião administrativa',
            'Curso de atualização',
            'Compromisso pessoal',
        ];

        foreach (array_slice($doctors, 0, 3) as $doctor) {
            // Bloqueio para próxima semana
            ScheduleBlock::create([
                'doctor_id' => $doctor->id,
                'blocked_date' => now()->addDays(rand(7, 14))->format('Y-m-d'),
                'start_time' => '08:00',
                'end_time' => '12:00',
                'reason' => $reasons[array_rand($reasons)],
            ]);
        }
    }

    private function generateEmail(string $name): string
    {
        $slug = str($name)
            ->lower()
            ->ascii()
            ->replace(' ', '.')
            ->replace('..', '.')
            ->toString();
        
        return $slug . '@email.com';
    }

    private function generatePhone(): string
    {
        return '(48) 9' . rand(8000, 9999) . '-' . rand(1000, 9999);
    }

    private function generateCPF(): string
    {
        $n = [];
        for ($i = 0; $i < 9; $i++) {
            $n[] = rand(0, 9);
        }
        
        // Cálculo do primeiro dígito verificador
        $d1 = 0;
        for ($i = 0; $i < 9; $i++) {
            $d1 += $n[$i] * (10 - $i);
        }
        $d1 = 11 - ($d1 % 11);
        if ($d1 >= 10) $d1 = 0;
        $n[] = $d1;
        
        // Cálculo do segundo dígito verificador
        $d2 = 0;
        for ($i = 0; $i < 10; $i++) {
            $d2 += $n[$i] * (11 - $i);
        }
        $d2 = 11 - ($d2 % 11);
        if ($d2 >= 10) $d2 = 0;
        $n[] = $d2;
        
        return sprintf('%d%d%d.%d%d%d.%d%d%d-%d%d', ...$n);
    }
}

<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

echo "=== Gerando dados de teste para consultas ===\n\n";

// Buscar médico
$doctor = Doctor::first();
if (!$doctor) {
    echo "Nenhum médico encontrado!\n";
    exit(1);
}
echo "Médico: {$doctor->user->name} (ID: {$doctor->id})\n\n";

// Buscar ou criar pacientes
$patients = Patient::take(5)->get();
if ($patients->count() < 5) {
    echo "Criando pacientes de teste...\n";
    for ($i = $patients->count(); $i < 5; $i++) {
        $user = User::create([
            'name' => "Paciente Teste " . ($i + 1),
            'email' => "paciente.teste" . ($i + 1) . "@email.com",
            'phone' => "1199999" . str_pad($i, 4, '0', STR_PAD_LEFT),
            'password' => Hash::make('123456'),
            'role' => 'PATIENT',
            'is_active' => true,
        ]);
        
        Patient::create([
            'user_id' => $user->id,
            'cpf' => '000.000.000-' . str_pad($i, 2, '0', STR_PAD_LEFT),
            'birth_date' => Carbon::now()->subYears(rand(20, 60))->format('Y-m-d'),
            'gender' => rand(0, 1) ? 'M' : 'F',
            'profile_completed_at' => now(),
        ]);
        echo "  - Paciente {$user->name} criado\n";
    }
    $patients = Patient::take(5)->get();
}

echo "\nPacientes disponíveis: " . $patients->count() . "\n\n";

// Limpar consultas antigas de teste (opcional)
// Appointment::where('doctor_id', $doctor->id)->delete();

$types = ['FIRST', 'RETURN', 'EXAM_REVIEW', 'URGENCY'];
$baseDate = Carbon::now();

$created = [
    'PENDING' => 0,
    'CONFIRMED' => 0,
    'COMPLETED' => 0,
    'CANCELLED' => 0,
    'NO_SHOW' => 0,
];

echo "Criando consultas...\n\n";

// 10 PENDING (futuras)
echo "--- PENDING (10) ---\n";
for ($i = 0; $i < 10; $i++) {
    $patient = $patients->random();
    $scheduledAt = $baseDate->copy()->addDays(rand(2, 30))->setHour(rand(8, 17))->setMinute(rand(0, 1) * 30)->setSecond(0);
    
    try {
        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => 30,
            'status' => 'PENDING',
            'type' => $types[array_rand($types)],
            'notes' => 'Consulta de teste - PENDING #' . ($i + 1),
        ]);
        $created['PENDING']++;
        echo "  PENDING: {$patient->user->name} em {$scheduledAt->format('d/m/Y H:i')}\n";
    } catch (Exception $e) {
        echo "  [ERRO] {$e->getMessage()}\n";
    }
}

// 10 CONFIRMED (futuras)
echo "\n--- CONFIRMED (10) ---\n";
for ($i = 0; $i < 10; $i++) {
    $patient = $patients->random();
    $scheduledAt = $baseDate->copy()->addDays(rand(2, 30))->setHour(rand(8, 17))->setMinute(rand(0, 1) * 30)->setSecond(0);
    
    try {
        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => 30,
            'status' => 'CONFIRMED',
            'type' => $types[array_rand($types)],
            'notes' => 'Consulta de teste - CONFIRMED #' . ($i + 1),
            'confirmed_at' => now(),
        ]);
        $created['CONFIRMED']++;
        echo "  CONFIRMED: {$patient->user->name} em {$scheduledAt->format('d/m/Y H:i')}\n";
    } catch (Exception $e) {
        echo "  [ERRO] {$e->getMessage()}\n";
    }
}

// 10 COMPLETED (passadas)
echo "\n--- COMPLETED (10) ---\n";
for ($i = 0; $i < 10; $i++) {
    $patient = $patients->random();
    $scheduledAt = $baseDate->copy()->subDays(rand(1, 30))->setHour(rand(8, 17))->setMinute(rand(0, 1) * 30)->setSecond(0);
    
    try {
        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => 30,
            'status' => 'COMPLETED',
            'type' => $types[array_rand($types)],
            'notes' => 'Consulta de teste - COMPLETED #' . ($i + 1),
            'confirmed_at' => $scheduledAt->copy()->subDays(1),
            'completed_at' => $scheduledAt,
        ]);
        $created['COMPLETED']++;
        echo "  COMPLETED: {$patient->user->name} em {$scheduledAt->format('d/m/Y H:i')}\n";
    } catch (Exception $e) {
        echo "  [ERRO] {$e->getMessage()}\n";
    }
}

// 10 CANCELLED (mistas)
echo "\n--- CANCELLED (10) ---\n";
for ($i = 0; $i < 10; $i++) {
    $patient = $patients->random();
    $scheduledAt = $baseDate->copy()->addDays(rand(-15, 15))->setHour(rand(8, 17))->setMinute(rand(0, 1) * 30)->setSecond(0);
    
    try {
        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => 30,
            'status' => 'CANCELLED',
            'type' => $types[array_rand($types)],
            'notes' => 'Consulta de teste - CANCELLED #' . ($i + 1),
            'cancelled_at' => now()->subDays(rand(0, 5)),
        ]);
        $created['CANCELLED']++;
        echo "  CANCELLED: {$patient->user->name} em {$scheduledAt->format('d/m/Y H:i')}\n";
    } catch (Exception $e) {
        echo "  [ERRO] {$e->getMessage()}\n";
    }
}

// 10 NO_SHOW (passadas)
echo "\n--- NO_SHOW (10) ---\n";
for ($i = 0; $i < 10; $i++) {
    $patient = $patients->random();
    $scheduledAt = $baseDate->copy()->subDays(rand(1, 30))->setHour(rand(8, 17))->setMinute(rand(0, 1) * 30)->setSecond(0);
    
    try {
        Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => 30,
            'status' => 'NO_SHOW',
            'type' => $types[array_rand($types)],
            'notes' => 'Consulta de teste - NO_SHOW #' . ($i + 1),
            'confirmed_at' => $scheduledAt->copy()->subDays(1),
        ]);
        $created['NO_SHOW']++;
        echo "  NO_SHOW: {$patient->user->name} em {$scheduledAt->format('d/m/Y H:i')}\n";
    } catch (Exception $e) {
        echo "  [ERRO] {$e->getMessage()}\n";
    }
}

// Limpar cache
Illuminate\Support\Facades\Cache::flush();

echo "\n=== RESUMO ===\n";
foreach ($created as $status => $count) {
    echo "  {$status}: {$count} consultas criadas\n";
}
echo "\nTotal: " . array_sum($created) . " consultas\n";
echo "\n✅ Dados de teste gerados com sucesso!\n";

<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\Schedule;
use Carbon\Carbon;

// Buscar o médico admin
$user = User::where('email', 'admin@hotmail.com')->first();
if (!$user) {
    echo "Médico não encontrado!\n";
    exit(1);
}

$doctor = Doctor::where('user_id', $user->id)->first();
if (!$doctor) {
    echo "Registro de médico não encontrado!\n";
    exit(1);
}

echo "Médico encontrado: {$user->name} (ID: {$doctor->id})\n";

// Criar agenda do médico (Segunda a Sexta, 08:00-12:00 e 14:00-18:00)
echo "\n--- Criando agenda do médico ---\n";
Schedule::where('doctor_id', $doctor->id)->delete();

for ($day = 1; $day <= 5; $day++) {
    // Manhã
    Schedule::create([
        'doctor_id' => $doctor->id,
        'day_of_week' => $day,
        'start_time' => '08:00',
        'end_time' => '12:00',
        'slot_duration_minutes' => 30,
    ]);
    // Tarde
    Schedule::create([
        'doctor_id' => $doctor->id,
        'day_of_week' => $day,
        'start_time' => '14:00',
        'end_time' => '18:00',
        'slot_duration_minutes' => 30,
    ]);
}
echo "Agenda criada: Segunda a Sexta, 08:00-12:00 e 14:00-18:00\n";

// Buscar pacientes existentes
$patients = Patient::with('user')->limit(5)->get();
if ($patients->isEmpty()) {
    echo "Nenhum paciente encontrado!\n";
    exit(1);
}

echo "\n--- Criando consultas ---\n";

// Criar consultas variadas
$statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
$appointmentCount = 0;

// Consultas passadas
foreach (['COMPLETED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] as $index => $status) {
    $patient = $patients[$index % count($patients)];
    $date = Carbon::now()->subDays(rand(1, 30))->setHour(rand(8, 17))->setMinute(0)->setSecond(0);
    
    Appointment::create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'scheduled_at' => $date,
        'status' => $status,
        'notes' => $status === 'COMPLETED' ? 'Consulta realizada com sucesso.' : null,
    ]);
    echo "Consulta {$status} criada para {$patient->user->name} em {$date->format('d/m/Y H:i')}\n";
    $appointmentCount++;
}

// Consultas futuras
foreach (['PENDING', 'CONFIRMED', 'PENDING'] as $index => $status) {
    $patient = $patients[$index % count($patients)];
    $date = Carbon::now()->addDays(rand(1, 14))->setHour(rand(8, 17))->setMinute(0)->setSecond(0);
    
    Appointment::create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'scheduled_at' => $date,
        'status' => $status,
        'notes' => null,
    ]);
    echo "Consulta {$status} criada para {$patient->user->name} em {$date->format('d/m/Y H:i')}\n";
    $appointmentCount++;
}

echo "\nTotal de consultas criadas: {$appointmentCount}\n";

// Criar notificações para o médico
echo "\n--- Criando notificações ---\n";
Notification::where('user_id', $user->id)->delete();

$notifications = [
    [
        'title' => 'Nova consulta agendada',
        'message' => 'Um paciente agendou uma consulta para amanhã às 10:00.',
        'type' => 'CONFIRMATION',
        'read_at' => null,
    ],
    [
        'title' => 'Consulta confirmada',
        'message' => 'O paciente confirmou presença na consulta de hoje.',
        'type' => 'CONFIRMATION',
        'read_at' => Carbon::now()->subHours(2),
    ],
    [
        'title' => 'Lembrete de consulta',
        'message' => 'Você tem 3 consultas agendadas para hoje.',
        'type' => 'REMINDER',
        'read_at' => null,
    ],
    [
        'title' => 'Consulta cancelada',
        'message' => 'Um paciente cancelou a consulta marcada para sexta-feira.',
        'type' => 'CANCELLATION',
        'read_at' => Carbon::now()->subDay(),
    ],
    [
        'title' => 'Consulta reagendada',
        'message' => 'Um paciente reagendou a consulta para a próxima semana.',
        'type' => 'RESCHEDULING',
        'read_at' => Carbon::now()->subDays(5),
    ],
];

foreach ($notifications as $notif) {
    Notification::create([
        'user_id' => $user->id,
        'title' => $notif['title'],
        'message' => $notif['message'],
        'type' => $notif['type'],
        'read_at' => $notif['read_at'],
    ]);
    echo "Notificação criada: {$notif['title']}\n";
}

echo "\n=== Dados criados com sucesso! ===\n";
echo "Médico: {$user->name}\n";
echo "Email: {$user->email}\n";
echo "Consultas: {$appointmentCount}\n";
echo "Notificações: " . count($notifications) . "\n";

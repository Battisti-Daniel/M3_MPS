<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Notification;
use Carbon\Carbon;

// Buscar o médico admin
$user = User::where('email', 'admin@hotmail.com')->first();
if (!$user) {
    echo "Médico não encontrado!\n";
    exit(1);
}

echo "Médico encontrado: {$user->name}\n";

// Criar notificações para o médico
echo "\n--- Criando notificações ---\n";
Notification::where('user_id', $user->id)->delete();

$notifications = [
    [
        'subject' => 'Nova consulta agendada',
        'message' => 'Um paciente agendou uma consulta para amanhã às 10:00.',
        'type' => 'CONFIRMATION',
        'channel' => 'EMAIL',
        'read_at' => null,
    ],
    [
        'subject' => 'Consulta confirmada',
        'message' => 'O paciente confirmou presença na consulta de hoje.',
        'type' => 'CONFIRMATION',
        'channel' => 'EMAIL',
        'read_at' => Carbon::now()->subHours(2),
    ],
    [
        'subject' => 'Lembrete de consulta',
        'message' => 'Você tem 3 consultas agendadas para hoje.',
        'type' => 'REMINDER',
        'channel' => 'EMAIL',
        'read_at' => null,
    ],
    [
        'subject' => 'Consulta cancelada',
        'message' => 'Um paciente cancelou a consulta marcada para sexta-feira.',
        'type' => 'CANCELLATION',
        'channel' => 'EMAIL',
        'read_at' => Carbon::now()->subDay(),
    ],
    [
        'subject' => 'Consulta reagendada',
        'message' => 'Um paciente reagendou a consulta para a próxima semana.',
        'type' => 'RESCHEDULING',
        'channel' => 'EMAIL',
        'read_at' => null,
    ],
];

foreach ($notifications as $notif) {
    Notification::create([
        'user_id' => $user->id,
        'subject' => $notif['subject'],
        'message' => $notif['message'],
        'type' => $notif['type'],
        'channel' => $notif['channel'],
        'read_at' => $notif['read_at'],
        'sent_at' => Carbon::now()->subMinutes(rand(1, 60)),
    ]);
    echo "Notificação criada: {$notif['subject']}\n";
}

echo "\n=== Notificações criadas com sucesso! ===\n";

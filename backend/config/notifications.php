<?php

use App\Domain\Shared\Enums\NotificationType;

return [
    'templates' => [
        'appointment_created_doctor' => [
            'type' => NotificationType::REMINDER,
            'subject' => 'Nova consulta agendada',
            'message' => 'Olá Dr(a). :doctor! Uma nova consulta foi agendada com o paciente :patient para o dia :date às :time. Acesse o sistema para mais detalhes.',
        ],
        'appointment_created_patient' => [
            'type' => NotificationType::CONFIRMATION,
            'subject' => 'Consulta agendada com sucesso',
            'message' => 'Olá :patient! Sua consulta com Dr(a). :doctor foi agendada para o dia :date às :time. Lembre-se de chegar com 15 minutos de antecedência.',
        ],
        'appointment_confirmed_patient' => [
            'type' => NotificationType::CONFIRMATION,
            'subject' => 'Consulta confirmada',
            'message' => 'Olá :patient! Sua consulta com Dr(a). :doctor no dia :date às :time foi confirmada. Aguardamos você!',
        ],
        'appointment_confirmed_doctor' => [
            'type' => NotificationType::CONFIRMATION,
            'subject' => 'Paciente confirmou consulta',
            'message' => 'Olá Dr(a). :doctor! O paciente :patient confirmou a consulta agendada para o dia :date às :time.',
        ],
        'appointment_cancelled_patient' => [
            'type' => NotificationType::CANCELLATION,
            'subject' => 'Consulta cancelada',
            'message' => 'Olá :patient! Sua consulta com Dr(a). :doctor foi cancelada. Motivo: :reason. Entre em contato para reagendar.',
        ],
        'appointment_cancelled_doctor' => [
            'type' => NotificationType::CANCELLATION,
            'subject' => 'Consulta cancelada',
            'message' => 'Olá Dr(a). :doctor! A consulta com o paciente :patient foi cancelada. Motivo: :reason.',
        ],
        'appointment_rescheduled_patient' => [
            'type' => NotificationType::RESCHEDULING,
            'subject' => 'Consulta remarcada',
            'message' => 'Olá :patient! Sua consulta com Dr(a). :doctor foi remarcada para o dia :date às :time. Verifique sua agenda.',
        ],
        'appointment_rescheduled_doctor' => [
            'type' => NotificationType::RESCHEDULING,
            'subject' => 'Consulta remarcada',
            'message' => 'Olá Dr(a). :doctor! A consulta com o paciente :patient foi remarcada para o dia :date às :time.',
        ],
        'appointment_reminder_patient' => [
            'type' => NotificationType::REMINDER,
            'subject' => 'Lembrete de consulta',
            'message' => 'Olá :patient! Lembrete: você tem uma consulta com Dr(a). :doctor amanhã, dia :date às :time. Não se esqueça!',
        ],
        'appointment_reminder_doctor' => [
            'type' => NotificationType::REMINDER,
            'subject' => 'Lembrete de consulta',
            'message' => 'Olá Dr(a). :doctor! Lembrete: você tem uma consulta com o paciente :patient amanhã, dia :date às :time.',
        ],
        'appointment_completed_patient' => [
            'type' => NotificationType::CONFIRMATION,
            'subject' => 'Consulta realizada',
            'message' => 'Olá :patient! Sua consulta com Dr(a). :doctor foi realizada com sucesso. Obrigado pela preferência!',
        ],
        'patient_welcome' => [
            'type' => NotificationType::CONFIRMATION,
            'subject' => 'Bem-vindo ao Agenda+',
            'message' => 'Olá :name! Bem-vindo ao Agenda+. Suas credenciais de acesso foram criadas. E-mail: :email. Por favor, mantenha sua senha segura.',
        ],
    ],
];

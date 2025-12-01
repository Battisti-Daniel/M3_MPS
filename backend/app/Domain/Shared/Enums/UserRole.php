<?php

namespace App\Domain\Shared\Enums;

enum UserRole: string
{
    case ADMIN = 'ADMIN';
    case DOCTOR = 'DOCTOR';
    case PATIENT = 'PATIENT';

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Administrador',
            self::DOCTOR => 'Médico',
            self::PATIENT => 'Paciente',
        };
    }
}

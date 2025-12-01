<?php

namespace App\Domain\Appointments;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use Illuminate\Validation\ValidationException;

class AppointmentStatusWorkflow
{
    private const ALLOWED_TRANSITIONS = [
        AppointmentStatus::PENDING->value => [
            AppointmentStatus::CONFIRMED->value,
            AppointmentStatus::CANCELLED->value,
        ],
        AppointmentStatus::CONFIRMED->value => [
            AppointmentStatus::COMPLETED->value,
            AppointmentStatus::CANCELLED->value,
            AppointmentStatus::NO_SHOW->value,
        ],
        AppointmentStatus::COMPLETED->value => [],
        AppointmentStatus::CANCELLED->value => [],
        AppointmentStatus::NO_SHOW->value => [],
    ];

    private const ROLE_PERMISSIONS = [
        UserRole::ADMIN->value => [
            AppointmentStatus::PENDING->value => [AppointmentStatus::CONFIRMED->value, AppointmentStatus::CANCELLED->value],
            AppointmentStatus::CONFIRMED->value => [AppointmentStatus::COMPLETED->value, AppointmentStatus::CANCELLED->value, AppointmentStatus::NO_SHOW->value],
            AppointmentStatus::COMPLETED->value => [],
            AppointmentStatus::CANCELLED->value => [],
            AppointmentStatus::NO_SHOW->value => [],
        ],
        UserRole::DOCTOR->value => [
            AppointmentStatus::PENDING->value => [AppointmentStatus::CONFIRMED->value, AppointmentStatus::CANCELLED->value],
            AppointmentStatus::CONFIRMED->value => [AppointmentStatus::COMPLETED->value, AppointmentStatus::CANCELLED->value, AppointmentStatus::NO_SHOW->value],
            AppointmentStatus::COMPLETED->value => [],
            AppointmentStatus::CANCELLED->value => [],
            AppointmentStatus::NO_SHOW->value => [],
        ],
        UserRole::PATIENT->value => [
            AppointmentStatus::PENDING->value => [AppointmentStatus::CANCELLED->value],
            AppointmentStatus::CONFIRMED->value => [AppointmentStatus::CANCELLED->value],
            AppointmentStatus::COMPLETED->value => [],
            AppointmentStatus::CANCELLED->value => [],
            AppointmentStatus::NO_SHOW->value => [],
        ],
    ];

    public function canTransition(
        AppointmentStatus $currentStatus,
        AppointmentStatus $newStatus,
        UserRole $userRole
    ): bool {
        if ($currentStatus === $newStatus) {
            return true;
        }

        $allowedForRole = self::ROLE_PERMISSIONS[$userRole->value][$currentStatus->value] ?? [];

        return in_array($newStatus->value, $allowedForRole, true);
    }

    public function validateTransition(
        AppointmentStatus $currentStatus,
        AppointmentStatus $newStatus,
        UserRole $userRole
    ): void {
        if (! $this->canTransition($currentStatus, $newStatus, $userRole)) {
            throw ValidationException::withMessages([
                'status' => __(
                    'Transição de status inválida: não é possível alterar de :current para :new para o perfil :role.',
                    [
                        'current' => $currentStatus->value,
                        'new' => $newStatus->value,
                        'role' => $userRole->value,
                    ]
                ),
            ]);
        }
    }

    public function getAllowedTransitions(AppointmentStatus $currentStatus, UserRole $userRole): array
    {
        return self::ROLE_PERMISSIONS[$userRole->value][$currentStatus->value] ?? [];
    }

    public function isFinalStatus(AppointmentStatus $status): bool
    {
        return $status->isFinal();
    }
}

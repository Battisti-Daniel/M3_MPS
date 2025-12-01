<?php

namespace App\Policies;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Observation;
use App\Models\User;

class ObservationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Observation $observation): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::DOCTOR) {
            return $observation->doctor_id === $user->doctor?->id;
        }

        if ($role === UserRole::PATIENT) {
            return $observation->patient_id === $user->patient?->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::DOCTOR || $role === UserRole::ADMIN;
    }

    public function update(User $user, Observation $observation): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::DOCTOR) {
            return $observation->doctor_id === $user->doctor?->id;
        }

        return false;
    }

    public function delete(User $user, Observation $observation): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::ADMIN;
    }
}

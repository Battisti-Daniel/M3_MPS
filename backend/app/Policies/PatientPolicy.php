<?php

namespace App\Policies;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Patient;
use App\Models\User;

class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::ADMIN || $role === UserRole::DOCTOR;
    }

    public function view(User $user, Patient $patient): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::DOCTOR) {
            return true;
        }

        if ($role === UserRole::PATIENT) {
            return $patient->user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::ADMIN;
    }

    public function update(User $user, Patient $patient): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::PATIENT) {
            return $patient->user_id === $user->id;
        }

        return false;
    }

    public function delete(User $user, Patient $patient): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::ADMIN;
    }
}

<?php

namespace App\Policies;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Doctor;
use App\Models\User;

class DoctorPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Doctor $doctor): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::DOCTOR) {
            return $doctor->user_id === $user->id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::ADMIN;
    }

    public function update(User $user, Doctor $doctor): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::DOCTOR) {
            return $doctor->user_id === $user->id;
        }

        return false;
    }

    public function delete(User $user, Doctor $doctor): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::ADMIN;
    }
}

<?php

namespace App\Policies;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Appointment $appointment): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::DOCTOR) {
            return $appointment->doctor_id === $user->doctor?->id;
        }

        if ($role === UserRole::PATIENT) {
            return $appointment->patient_id === $user->patient?->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::PATIENT || $role === UserRole::ADMIN;
    }

    public function update(User $user, Appointment $appointment): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::DOCTOR) {
            return $appointment->doctor_id === $user->doctor?->id;
        }

        if ($role === UserRole::PATIENT) {
            return $appointment->patient_id === $user->patient?->id;
        }

        return false;
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::ADMIN;
    }

    public function cancel(User $user, Appointment $appointment): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return true;
        }

        if ($role === UserRole::PATIENT) {
            return $appointment->patient_id === $user->patient?->id;
        }

        if ($role === UserRole::DOCTOR) {
            return $appointment->doctor_id === $user->doctor?->id;
        }

        return false;
    }

    public function confirm(User $user, Appointment $appointment): bool
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        return $role === UserRole::DOCTOR && $appointment->doctor_id === $user->doctor?->id
            || $role === UserRole::ADMIN;
    }

    public function reschedule(User $user, Appointment $appointment): bool
    {
        return $this->update($user, $appointment);
    }
}

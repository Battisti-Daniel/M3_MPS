<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'manage users',
            'manage doctors',
            'manage patients',
            'manage schedules',
            'manage appointments',
            'view reports',
            'manage health insurances',
        ];

        // Cria permissões e roles para ambos os guards (web e sanctum)
        $guards = ['web', 'sanctum'];

        foreach ($guards as $guard) {
            $permissionModels = collect($permissions)
                ->map(fn (string $permission) => Permission::findOrCreate($permission, $guard));

            $adminRole = Role::findOrCreate(UserRole::ADMIN->value, $guard);
            $doctorRole = Role::findOrCreate(UserRole::DOCTOR->value, $guard);
            $patientRole = Role::findOrCreate(UserRole::PATIENT->value, $guard);

            $adminRole->syncPermissions($permissionModels);

            $doctorRole->syncPermissions($permissionModels->whereIn('name', [
                'manage schedules',
                'manage appointments',
            ]));

            $patientRole->syncPermissions($permissionModels->whereIn('name', [
                'manage appointments',
            ]));
        }
    }
}

<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class EnsureAdminPermissionsSeeder extends Seeder
{
    /**
     * Garante que todos os usuários admin tenham as permissões corretas
     */
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

        $permissionModels = collect($permissions)
            ->map(fn (string $permission) => Permission::findOrCreate($permission, 'web'));

        $adminRole = Role::findOrCreate(UserRole::ADMIN->value, 'web');
        $adminRole->syncPermissions($permissionModels);

        // Garante que todos os usuários admin tenham o role e permissões
        User::where('role', UserRole::ADMIN->value)->each(function (User $user) use ($adminRole) {
            if (! $user->hasRole($adminRole)) {
                $user->assignRole($adminRole);
            }
        });
    }
}

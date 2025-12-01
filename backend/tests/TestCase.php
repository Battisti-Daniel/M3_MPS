<?php

namespace Tests;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\AuthenticatesUsers;

abstract class TestCase extends BaseTestCase
{
    use AuthenticatesUsers, RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        // Limpar cache antes de cada teste (apenas se não for Redis)
        // Nos testes, usamos CACHE_DRIVER=array, então flush() é seguro
        if (config('cache.default') !== 'redis') {
            \Illuminate\Support\Facades\Cache::flush();
        }

        // Resetar cache de permissões
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Garantir que os roles existam
        $this->ensureRolesExist();
    }

    /**
     * Garante que os roles necessários existam no banco de dados
     */
    protected function ensureRolesExist(): void
    {
        // Criar roles para ambos os guards (web e sanctum)
        $guards = ['web', 'sanctum'];
        foreach ($guards as $guard) {
            Role::findOrCreate(UserRole::ADMIN->value, $guard);
            Role::findOrCreate(UserRole::DOCTOR->value, $guard);
            Role::findOrCreate(UserRole::PATIENT->value, $guard);
        }
    }

    /**
     * Atribui role para um usuário (seguindo o padrão do código de produção)
     * O Spatie Permission usa o guard padrão do modelo User ($guard_name = 'sanctum')
     */
    protected function assignRoleToUser(\App\Models\User $user, UserRole $role): void
    {
        // Usar assignRole() sem especificar guard, como no código de produção
        // O Spatie Permission usa o guard padrão do modelo User (sanctum)
        $user->assignRole($role->value);

        // Limpar cache do Spatie Permission após atribuir role
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Helper para criar usuário com role atribuído
     */
    protected function createUserWithRole(UserRole $role, array $attributes = []): \App\Models\User
    {
        $user = \App\Models\User::factory()->create(array_merge([
            'role' => $role,
            'is_active' => true,
        ], $attributes));

        $this->assignRoleToUser($user, $role);

        return $user;
    }
}

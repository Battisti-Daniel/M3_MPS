<?php

namespace Tests\Concerns;

use App\Models\User;
use Laravel\Sanctum\Sanctum;

trait AuthenticatesUsers
{
    /**
     * Autentica usuário usando Sanctum (recomendado para testes)
     * Conforme documentação: https://laravel.com/docs/12.x/sanctum#testing
     */
    protected function actingAsUser(User $user): self
    {
        // Usar Sanctum::actingAs conforme documentação oficial
        Sanctum::actingAs($user, ['*']);

        // Garantir que o guard 'sanctum' seja usado para autenticação
        // Isso é importante para que o Spatie Permission verifique o guard correto
        \Illuminate\Support\Facades\Auth::shouldUse('sanctum');

        return $this;
    }

    /**
     * Retorna headers de autenticação com token
     */
    protected function actingAsWithToken(User $user): array
    {
        $token = $user->createToken('test-token')->plainTextToken;

        return [
            'Authorization' => "Bearer {$token}",
        ];
    }

    /**
     * Helper para usar Sanctum::actingAs (mais simples)
     */
    protected function authAs(User $user): self
    {
        return $this->actingAsUser($user);
    }
}

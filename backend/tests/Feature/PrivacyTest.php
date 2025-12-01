<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_pode_aceitar_politica_de_privacidade(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
            'privacy_policy_accepted_at' => null,
        ]);

        $this->assignRoleToUser($user, UserRole::PATIENT);

        $this->authAs($user);

        $response = $this->postJson('/api/privacy/accept');

        $response->assertStatus(200);

        $user->refresh();
        $this->assertNotNull($user->privacy_policy_accepted_at);
    }

    public function test_usuario_pode_solicitar_exportacao_de_dados(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $this->assignRoleToUser($user, UserRole::PATIENT);

        $this->authAs($user);

        $response = $this->getJson('/api/privacy/export');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
            ]);
    }

    public function test_usuario_pode_solicitar_remocao_de_dados(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $this->assignRoleToUser($user, UserRole::PATIENT);

        $this->authAs($user);

        $response = $this->postJson('/api/privacy/request-erasure');

        $response->assertStatus(200);

        $user->refresh();
        $this->assertNotNull($user->data_erasure_requested_at);
    }
}

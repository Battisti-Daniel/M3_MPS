<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_paciente_pode_fazer_login_com_sucesso(): void
    {
        $user = User::factory()->create([
            'email' => 'paciente@test.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::PATIENT,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'paciente@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'role',
                ],
            ]);

        $this->assertNotNull($response->json('token'));
    }

    public function test_login_falha_com_credenciais_invalidas(): void
    {
        User::factory()->create([
            'email' => 'paciente@test.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::PATIENT,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'paciente@test.com',
            'password' => 'senha_errada',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_conta_e_bloqueada_apos_3_tentativas_falhas(): void
    {
        $user = User::factory()->create([
            'email' => 'paciente@test.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::PATIENT,
            'is_active' => true,
        ]);

        // 3 tentativas falhas
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'paciente@test.com',
                'password' => 'senha_errada',
            ]);
        }

        // 4ª tentativa deve falhar com conta bloqueada
        $response = $this->postJson('/api/auth/login', [
            'email' => 'paciente@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Sua conta está temporariamente bloqueada. Tente novamente mais tarde.',
            ]);

        $user->refresh();
        $this->assertNotNull($user->locked_until);
    }

    public function test_usuario_inativo_nao_pode_fazer_login(): void
    {
        $user = User::factory()->create([
            'email' => 'paciente@test.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::PATIENT,
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'paciente@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Sua conta está desativada. Entre em contato com o suporte.',
            ]);
    }

    public function test_pode_recuperar_senha(): void
    {
        $user = User::factory()->create([
            'email' => 'paciente@test.com',
            'role' => UserRole::PATIENT,
        ]);

        $response = $this->postJson('/api/auth/password/forgot', [
            'email' => 'paciente@test.com',
        ]);

        $response->assertStatus(200);
    }

    public function test_pode_obter_usuario_autenticado(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->id,
                'email' => $user->email,
            ]);
    }

    public function test_pode_fazer_logout(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $response->assertStatus(200);

        // Verificar que token foi revogado
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }
}

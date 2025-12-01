<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_pode_ver_seu_perfil(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $this->assignRoleToUser($user, UserRole::PATIENT);

        $this->authAs($user);

        $response = $this->getJson('/api/profile');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                ],
            ]);
    }

    public function test_usuario_pode_atualizar_seu_perfil(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $this->assignRoleToUser($user, UserRole::PATIENT);

        $this->authAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => 'Nome Atualizado',
            'phone' => '(11) 88888-8888',
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertEquals('Nome Atualizado', $user->name);
        $this->assertEquals('(11) 88888-8888', $user->phone);
    }

    public function test_usuario_pode_atualizar_senha(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
            'password' => Hash::make('senha_antiga'),
        ]);

        $this->authAs($user);

        $response = $this->putJson('/api/profile', [
            'current_password' => 'senha_antiga',
            'password' => 'nova_senha_123',
            'password_confirmation' => 'nova_senha_123',
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertTrue(Hash::check('nova_senha_123', $user->password));
    }

    public function test_nao_pode_atualizar_senha_sem_senha_atual_correta(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
            'password' => Hash::make('senha_antiga'),
        ]);

        $this->authAs($user);

        $response = $this->putJson('/api/profile', [
            'current_password' => 'senha_errada',
            'password' => 'nova_senha_123',
            'password_confirmation' => 'nova_senha_123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_senha_deve_ter_minimo_8_caracteres(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $this->assignRoleToUser($user, UserRole::PATIENT);

        $this->authAs($user);

        $response = $this->putJson('/api/profile', [
            'password' => '1234567',
            'password_confirmation' => '1234567',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}

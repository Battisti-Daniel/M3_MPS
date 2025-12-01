<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminPatientTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_pode_cadastrar_paciente(): void
    {
        $admin = $this->createAdmin();

        Mail::fake();

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/patients', [
                'name' => 'João Silva',
                'email' => 'joao@test.com',
                'phone' => '(11) 99999-9999',
                'cpf' => '12345678901',
                'birth_date' => '1990-01-01',
                'address' => 'Rua Teste, 123',
                'gender' => 'M',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'user_id',
                    'cpf',
                    'birth_date',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'joao@test.com',
            'role' => UserRole::PATIENT->value,
        ]);

        $this->assertDatabaseHas('patients', [
            'cpf' => '12345678901',
        ]);
    }

    public function test_admin_pode_listar_pacientes(): void
    {
        $admin = $this->createAdmin();

        Patient::factory()->count(5)->create();

        $this->authAs($admin);

        $response = $this->getJson('/api/admin/patients');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'user_id', 'cpf'],
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_admin_pode_atualizar_paciente(): void
    {
        $admin = $this->createAdmin();
        $patient = Patient::factory()->create();

        $this->authAs($admin);

        $response = $this->putJson("/api/admin/patients/{$patient->id}", [
            'name' => 'Nome Atualizado',
            'phone' => '(11) 88888-8888',
        ]);

        $response->assertStatus(200);

        $patient->refresh();
        $this->assertEquals('Nome Atualizado', $patient->user->name);
    }

    public function test_cpf_deve_ser_unico(): void
    {
        $admin = $this->createAdmin();

        Patient::factory()->create(['cpf' => '12345678901']);

        $this->authAs($admin);

        $response = $this->postJson('/api/admin/patients', [
            'name' => 'Outro Paciente',
            'email' => 'outro@test.com',
            'phone' => '(11) 99999-9999',
            'cpf' => '12345678901',
            'birth_date' => '1990-01-01',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cpf']);
    }

    public function test_nao_admin_nao_pode_cadastrar_paciente(): void
    {
        $patient = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $this->authAs($patient);

        $response = $this->postJson('/api/admin/patients', [
            'name' => 'Teste',
            'email' => 'test@test.com',
            'phone' => '(11) 99999-9999',
            'cpf' => '12345678901',
            'birth_date' => '1990-01-01',
        ]);

        $response->assertStatus(403);
    }

    protected function createAdmin(): User
    {
        $user = User::factory()->create([
            'role' => UserRole::ADMIN,
            'is_active' => true,
        ]);

        $this->assignRoleToUser($user, UserRole::ADMIN);

        return $user;
    }
}

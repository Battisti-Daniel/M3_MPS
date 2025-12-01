<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDoctorTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_pode_cadastrar_medico(): void
    {
        $admin = $this->createAdmin();

        // Debug: verificar se o role foi atribuído para o guard sanctum
        $this->assertTrue($admin->hasRole(UserRole::ADMIN->value, 'sanctum'));
        $this->assertTrue($admin->hasAnyRole([UserRole::ADMIN->value], 'sanctum'));

        $this->authAs($admin);

        $response = $this->postJson('/api/admin/doctors', [
            'name' => 'Dr. João Silva',
            'email' => 'joao.medico@test.com',
            'phone' => '(11) 99999-9999',
            'password' => 'password123',
            'crm' => 'CRM123456',
            'specialty' => 'Cardiologia',
            'qualification' => 'Especialista em Cardiologia',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'user_id',
                    'crm',
                    'specialty',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'joao.medico@test.com',
            'role' => UserRole::DOCTOR->value,
        ]);

        $this->assertDatabaseHas('doctors', [
            'crm' => 'CRM123456',
        ]);
    }

    public function test_admin_pode_listar_medicos(): void
    {
        $admin = $this->createAdmin();

        Doctor::factory()->count(5)->create();

        $this->authAs($admin);

        $response = $this->getJson('/api/admin/doctors');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'user_id', 'crm', 'specialty'],
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_crm_deve_ser_unico(): void
    {
        $admin = $this->createAdmin();

        Doctor::factory()->create(['crm' => 'CRM123456']);

        $this->authAs($admin);

        $response = $this->postJson('/api/admin/doctors', [
            'name' => 'Outro Médico',
            'email' => 'outro@test.com',
            'phone' => '(11) 99999-9999',
            'password' => 'password123',
            'crm' => 'CRM123456',
            'specialty' => 'Dermatologia',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['crm']);
    }

    public function test_admin_pode_inativar_medico(): void
    {
        $admin = $this->createAdmin();
        $doctor = Doctor::factory()->create(['is_active' => true]);

        $this->authAs($admin);

        $response = $this->putJson("/api/admin/doctors/{$doctor->id}", [
            'is_active' => false,
        ]);

        $response->assertStatus(200);

        $doctor->refresh();
        $this->assertFalse($doctor->is_active);
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

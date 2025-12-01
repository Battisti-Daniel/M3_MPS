<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\HealthInsurance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthInsuranceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_pode_cadastrar_convenio(): void
    {
        $admin = $this->createAdmin();

        $this->authAs($admin);

        $response = $this->postJson('/api/health-insurances', [
            'name' => 'Unimed',
            'description' => 'Plano de saúde Unimed',
            'coverage_percentage' => 80.00,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'coverage_percentage',
                ],
            ]);

        $this->assertDatabaseHas('health_insurances', [
            'name' => 'Unimed',
        ]);
    }

    public function test_admin_pode_listar_convenios(): void
    {
        $admin = $this->createAdmin();

        HealthInsurance::factory()->count(5)->create();

        $this->authAs($admin);

        $response = $this->getJson('/api/health-insurances');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'is_active'],
                ],
            ]);
    }

    public function test_admin_pode_atualizar_convenio(): void
    {
        $admin = $this->createAdmin();
        $insurance = HealthInsurance::factory()->create();

        $this->authAs($admin);

        $response = $this->putJson("/api/health-insurances/{$insurance->id}", [
            'name' => 'Nome Atualizado',
            'coverage_percentage' => 90.00,
        ]);

        $response->assertStatus(200);

        $insurance->refresh();
        $this->assertEquals('Nome Atualizado', $insurance->name);
    }

    public function test_admin_pode_inativar_convenio(): void
    {
        $admin = $this->createAdmin();
        $insurance = HealthInsurance::factory()->create(['is_active' => true]);

        $this->authAs($admin);

        $response = $this->deleteJson("/api/health-insurances/{$insurance->id}");

        $response->assertStatus(200);

        $insurance->refresh();
        $this->assertSoftDeleted('health_insurances', [
            'id' => $insurance->id,
        ]);
    }

    public function test_qualquer_usuario_pode_listar_convenios_ativos(): void
    {
        HealthInsurance::factory()->count(3)->create(['is_active' => true]);
        HealthInsurance::factory()->count(2)->create(['is_active' => false]);

        $response = $this->getJson('/api/health-insurances');

        $response->assertStatus(200);

        // Deve retornar apenas convênios ativos
        $activeCount = collect($response->json('data'))
            ->filter(fn ($item) => $item['is_active'])
            ->count();

        $this->assertGreaterThan(0, $activeCount);
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

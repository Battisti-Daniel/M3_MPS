<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Doctor;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_pode_listar_notificacoes(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $user->assignRole(UserRole::PATIENT->value);

        Notification::factory()->count(5)->create([
            'user_id' => $user->id,
        ]);

        $this->authAs($user);

        $response = $this->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'type', 'subject', 'message', 'is_read'],
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_usuario_pode_marcar_notificacao_como_lida(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $user->assignRole(UserRole::PATIENT->value);

        $notification = Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $this->authAs($user);

        $response = $this->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200);

        $notification->refresh();
        $this->assertTrue($notification->is_read);
    }

    public function test_usuario_pode_marcar_todas_como_lidas(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $user->assignRole(UserRole::PATIENT->value);

        Notification::factory()->count(3)->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $this->authAs($user);

        $response = $this->postJson('/api/notifications/read-all');

        $response->assertStatus(204);

        $this->assertEquals(0, Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count());
    }

    public function test_notificacao_e_criada_ao_agendar_consulta(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        // Criar agenda para o médico
        $scheduledAt = \Carbon\Carbon::now()->addDays(2);
        \App\Models\Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'day_of_week' => $scheduledAt->dayOfWeekIso,
            'start_time' => '08:00:00',
            'end_time' => '18:00:00',
            'is_blocked' => false,
        ]);

        $this->authAs($patient->user);

        $response = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt->setTime(10, 0)->toIso8601String(),
            'duration_minutes' => 30,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $doctor->user_id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $patient->user_id,
        ]);
    }

    protected function createActiveDoctor(): Doctor
    {
        $user = User::factory()->create([
            'role' => UserRole::DOCTOR,
            'is_active' => true,
        ]);

        $this->assignRoleToUser($user, UserRole::DOCTOR);

        return Doctor::factory()->create([
            'user_id' => $user->id,
            'is_active' => true,
        ]);
    }

    protected function createActivePatient(): Patient
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
            'is_active' => true,
        ]);

        $this->assignRoleToUser($user, UserRole::PATIENT);

        return Patient::factory()->create([
            'user_id' => $user->id,
            'profile_completed_at' => now(),
        ]);
    }
}

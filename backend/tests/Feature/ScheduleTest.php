<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_medico_pode_criar_horario_disponivel(): void
    {
        $doctor = $this->createActiveDoctor();

        $this->authAs($doctor->user);

        $response = $this->postJson('/api/doctor/schedules', [
            'day_of_week' => 1, // Segunda-feira
            'start_time' => '08:00',
            'end_time' => '12:00',
            'slot_duration_minutes' => 30,
            'is_blocked' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'doctor_id',
                'day_of_week',
                'start_time',
                'end_time',
            ]);

        $this->assertDatabaseHas('schedules', [
            'doctor_id' => $doctor->id,
            'day_of_week' => 1,
        ]);
    }

    public function test_medico_deve_ter_minimo_4_horas_semanais(): void
    {
        $doctor = $this->createActiveDoctor();

        // Criar apenas 1 hora semanal
        Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'day_of_week' => 1,
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'is_blocked' => false,
        ]);

        $headers = $this->actingAsWithToken($doctor->user);

        $response = $this->withHeaders($headers)
            ->postJson('/api/doctor/schedules', [
                'day_of_week' => 2,
                'start_time' => '08:00',
                'end_time' => '09:00',
                'slot_duration_minutes' => 30,
                'is_blocked' => false,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['schedules']);
    }

    public function test_nao_pode_remover_horario_com_consultas_agendadas(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $schedule = Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'day_of_week' => 1,
            'start_time' => '08:00:00',
            'end_time' => '12:00:00',
        ]);

        Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'scheduled_at' => Carbon::now()->next(Carbon::MONDAY)->setTime(10, 0),
            'status' => \App\Domain\Shared\Enums\AppointmentStatus::PENDING,
        ]);

        $headers = $this->actingAsWithToken($doctor->user);

        $response = $this->withHeaders($headers)
            ->deleteJson("/api/doctor/schedules/{$schedule->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['schedule']);
    }

    public function test_medico_pode_listar_seus_horarios(): void
    {
        $doctor = $this->createActiveDoctor();

        Schedule::factory()->count(5)->create([
            'doctor_id' => $doctor->id,
        ]);

        $headers = $this->actingAsWithToken($doctor->user);

        $response = $this->withHeaders($headers)
            ->getJson('/api/doctor/schedules');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'doctor_id', 'day_of_week', 'start_time', 'end_time'],
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_nao_pode_criar_horarios_sobrepostos(): void
    {
        $doctor = $this->createActiveDoctor();

        Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'day_of_week' => 1,
            'start_time' => '08:00:00',
            'end_time' => '12:00:00',
            'is_blocked' => false,
        ]);

        $headers = $this->actingAsWithToken($doctor->user);

        $response = $this->withHeaders($headers)
            ->postJson('/api/doctor/schedules', [
                'day_of_week' => 1,
                'start_time' => '10:00',
                'end_time' => '14:00',
                'slot_duration_minutes' => 30,
                'is_blocked' => false,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_time']);
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

    protected function createActivePatient(): \App\Models\Patient
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
            'is_active' => true,
        ]);

        $this->assignRoleToUser($user, UserRole::PATIENT);

        return \App\Models\Patient::factory()->create([
            'user_id' => $user->id,
            'profile_completed_at' => now(),
        ]);
    }
}

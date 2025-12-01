<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_paciente_pode_agendar_consulta(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $this->createSchedule($doctor, Carbon::now()->addDays(2));

        $scheduledAt = Carbon::now()->addDays(2)->setTime(10, 0);

        $this->authAs($patient->user);

        $response = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt->toIso8601String(),
            'duration_minutes' => 30,
            'type' => 'PRESENTIAL',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'patient_id',
                    'doctor_id',
                    'scheduled_at',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => AppointmentStatus::PENDING->value,
        ]);
    }

    public function test_nao_pode_agendar_com_menos_de_24h_de_antecedencia(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $this->createSchedule($doctor, Carbon::now()->addHours(12));

        $scheduledAt = Carbon::now()->addHours(12);

        $this->authAs($patient->user);

        $response = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt->toIso8601String(),
            'duration_minutes' => 30,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['scheduled_at']);
    }

    public function test_nao_pode_agendar_com_medico_inativo(): void
    {
        $doctor = $this->createActiveDoctor();
        $doctor->update(['is_active' => false]);

        $patient = $this->createActivePatient();

        $scheduledAt = Carbon::now()->addDays(2);

        $this->authAs($patient->user);

        $response = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt->toIso8601String(),
            'duration_minutes' => 30,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['doctor_id']);
    }

    public function test_nao_pode_agendar_com_perfil_incompleto(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();
        $patient->update(['profile_completed_at' => null]);

        $this->createSchedule($doctor, Carbon::now()->addDays(2));

        $scheduledAt = Carbon::now()->addDays(2)->setTime(10, 0);

        $this->authAs($patient->user);

        $response = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt->toIso8601String(),
            'duration_minutes' => 30,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['patient']);
    }

    public function test_paciente_pode_cancelar_consulta_com_antecedencia(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => Carbon::now()->addDays(2),
            'status' => AppointmentStatus::PENDING,
        ]);

        $token = $patient->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/appointments/{$appointment->id}/cancel", [
                'reason' => 'Motivo do cancelamento',
            ]);

        $response->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals(AppointmentStatus::CANCELLED, $appointment->status);
    }

    public function test_nao_pode_cancelar_consulta_com_menos_de_12h(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => Carbon::now()->addHours(6),
            'status' => AppointmentStatus::PENDING,
        ]);

        $token = $patient->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/appointments/{$appointment->id}/cancel");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['scheduled_at']);
    }

    public function test_paciente_pode_remarcar_consulta(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $this->createSchedule($doctor, Carbon::now()->addDays(3));

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => Carbon::now()->addDays(2),
            'status' => AppointmentStatus::PENDING,
        ]);

        $newDate = Carbon::now()->addDays(3)->setTime(14, 0);

        $headers = $this->actingAsWithToken($patient->user);

        $response = $this->withHeaders($headers)
            ->postJson("/api/appointments/{$appointment->id}/reschedule", [
                'scheduled_at' => $newDate->toIso8601String(),
            ]);

        $response->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals($newDate->format('Y-m-d H:i'), $appointment->scheduled_at->format('Y-m-d H:i'));
    }

    public function test_nao_pode_remarcar_mais_de_2_vezes(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => Carbon::now()->addDays(2),
            'status' => AppointmentStatus::PENDING,
        ]);

        // Criar 2 logs de remarcação
        \App\Models\AppointmentLog::factory()->count(2)->create([
            'appointment_id' => $appointment->id,
            'metadata' => ['action' => 'rescheduled'],
        ]);

        $newDate = Carbon::now()->addDays(3);

        $token = $patient->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/appointments/{$appointment->id}/reschedule", [
                'scheduled_at' => $newDate->toIso8601String(),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['scheduled_at']);
    }

    public function test_paciente_pode_listar_suas_consultas(): void
    {
        $patient = $this->createActivePatient();

        Appointment::factory()->count(5)->create([
            'patient_id' => $patient->id,
        ]);

        $this->authAs($patient->user);

        $response = $this->getJson('/api/appointments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'patient_id', 'doctor_id', 'scheduled_at', 'status'],
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_pode_filtrar_consultas_por_periodo(): void
    {
        $patient = $this->createActivePatient();

        Appointment::factory()->create([
            'patient_id' => $patient->id,
            'scheduled_at' => Carbon::now()->addDays(1),
        ]);

        Appointment::factory()->create([
            'patient_id' => $patient->id,
            'scheduled_at' => Carbon::now()->subDays(1),
        ]);

        $this->authAs($patient->user);

        $response = $this->getJson('/api/appointments?period=future');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_medico_pode_confirmar_consulta(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => AppointmentStatus::PENDING,
        ]);

        $this->authAs($doctor->user);

        $response = $this->postJson("/api/appointments/{$appointment->id}/confirm");

        $response->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals(AppointmentStatus::CONFIRMED, $appointment->status);
    }

    public function test_medico_pode_completar_consulta(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => AppointmentStatus::CONFIRMED,
        ]);

        $this->authAs($doctor->user);

        $response = $this->postJson("/api/appointments/{$appointment->id}/complete");

        $response->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals(AppointmentStatus::COMPLETED, $appointment->status);
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

    protected function createSchedule(Doctor $doctor, Carbon $date): Schedule
    {
        return Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'day_of_week' => $date->dayOfWeekIso,
            'start_time' => '08:00:00',
            'end_time' => '18:00:00',
            'is_blocked' => false,
        ]);
    }
}

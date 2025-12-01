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

/**
 * Teste de integração completo - Fluxo end-to-end
 * Testa o fluxo completo de agendamento desde o cadastro até a conclusão
 */
class IntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_fluxo_completo_agendamento_consulta(): void
    {
        // 1. Admin cadastra médico
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN,
            'is_active' => true,
        ]);

        $admin->assignRole(UserRole::ADMIN->value);

        $this->authAs($admin);

        $doctorResponse = $this->postJson('/api/admin/doctors', [
            'name' => 'Dr. João Silva',
            'email' => 'joao.medico@test.com',
            'phone' => '(11) 99999-9999',
            'password' => 'password123',
            'crm' => 'CRM123456',
            'specialty' => 'Cardiologia',
        ]);

        $doctorResponse->assertStatus(201);
        $doctorId = $doctorResponse->json('data.id');
        $doctor = Doctor::find($doctorId);

        // 2. Admin cadastra paciente
        $patientResponse = $this->postJson('/api/admin/patients', [
            'name' => 'Maria Santos',
            'email' => 'maria@test.com',
            'phone' => '(11) 88888-8888',
            'cpf' => '12345678901',
            'birth_date' => '1990-01-01',
            'address' => 'Rua Teste, 123',
        ]);

        $patientResponse->assertStatus(201);
        $patientId = $patientResponse->json('data.id');
        $patient = Patient::find($patientId);

        // 3. Médico configura agenda
        $this->authAs($doctor->user);

        $scheduleResponse = $this->postJson('/api/doctor/schedules', [
            'day_of_week' => Carbon::now()->addDays(2)->dayOfWeekIso,
            'start_time' => '08:00',
            'end_time' => '18:00',
            'is_blocked' => false,
        ]);

        $scheduleResponse->assertStatus(201);

        // 4. Paciente agenda consulta (usa authAs diretamente já que a senha é gerada aleatoriamente)
        $patientUser = User::find($patient->user_id);
        $this->authAs($patientUser);

        $scheduledAt = Carbon::now()->addDays(2)->setTime(10, 0);

        $appointmentResponse = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'scheduled_at' => $scheduledAt->toIso8601String(),
            'duration_minutes' => 30,
            'type' => 'PRESENTIAL',
            'price' => 150.00,
        ]);

        $appointmentResponse->assertStatus(201);
        $appointmentId = $appointmentResponse->json('data.id');

        // 6. Médico confirma consulta
        $this->authAs($doctor->user);

        $confirmResponse = $this->postJson("/api/appointments/{$appointmentId}/confirm");
        $confirmResponse->assertStatus(200);

        $appointment = Appointment::find($appointmentId);
        $this->assertEquals(AppointmentStatus::CONFIRMED, $appointment->status);

        // 7. Médico completa consulta
        $completeResponse = $this->postJson("/api/appointments/{$appointmentId}/complete");
        $completeResponse->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals(AppointmentStatus::COMPLETED, $appointment->status);

        // 8. Médico registra observações
        $observationResponse = $this->postJson("/api/appointments/{$appointmentId}/observations", [
            'anamnesis' => 'Paciente relata dor no peito',
            'diagnosis' => 'Cefaleia tensional',
            'prescription' => 'Paracetamol 500mg',
            'notes' => 'Retorno em 7 dias',
        ]);

        $observationResponse->assertStatus(201);

        // 9. Admin gera relatório
        $this->authAs($admin);

        // Passar filtro de data que inclua o agendamento criado (2 dias no futuro)
        $startDate = Carbon::now()->subDays(1)->format('Y-m-d');
        $endDate = Carbon::now()->addDays(3)->format('Y-m-d');

        $reportResponse = $this->getJson("/api/admin/reports/appointments?start_date={$startDate}&end_date={$endDate}");
        $reportResponse->assertStatus(200);
        $this->assertGreaterThan(0, $reportResponse->json('total'));

        // 10. Verificar notificações foram criadas
        $this->assertDatabaseHas('notifications', [
            'user_id' => $doctor->user_id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $patient->user_id,
        ]);
    }

    public function test_fluxo_cancelamento_e_remarcacao(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();
        $this->createSchedule($doctor, Carbon::now()->addDays(2));
        $this->createSchedule($doctor, Carbon::now()->addDays(3));

        // Criar consulta
        $this->authAs($patient->user);

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => Carbon::now()->addDays(2),
            'status' => AppointmentStatus::PENDING,
        ]);

        // Cancelar consulta
        $cancelResponse = $this->postJson("/api/appointments/{$appointment->id}/cancel", [
            'reason' => 'Motivo pessoal',
        ]);

        $cancelResponse->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals(AppointmentStatus::CANCELLED, $appointment->status);

        // Criar nova consulta para remarcação (com horário diferente para evitar constraint violation)
        $appointment2 = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => Carbon::now()->addDays(2)->setTime(11, 0), // Horário diferente
            'status' => AppointmentStatus::PENDING,
        ]);

        // Remarcar
        $newDate = Carbon::now()->addDays(3)->setTime(14, 0);

        $rescheduleResponse = $this->postJson("/api/appointments/{$appointment2->id}/reschedule", [
            'scheduled_at' => $newDate->toIso8601String(),
        ]);

        $rescheduleResponse->assertStatus(200);

        $appointment2->refresh();
        $this->assertEquals($newDate->format('Y-m-d H:i'), $appointment2->scheduled_at->format('Y-m-d H:i'));
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

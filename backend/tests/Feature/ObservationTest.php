<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Observation;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ObservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_medico_pode_registrar_observacoes(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::COMPLETED,
        ]);

        $this->authAs($doctor->user);

        $response = $this->postJson("/api/appointments/{$appointment->id}/observations", [
            'anamnesis' => 'Paciente relata dor de cabeça',
            'diagnosis' => 'Cefaleia tensional',
            'prescription' => 'Paracetamol 500mg',
            'notes' => 'Retorno em 7 dias',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'appointment_id',
                    'doctor_id',
                    'patient_id',
                    'anamnesis',
                    'diagnosis',
                    'prescription',
                    'notes',
                ],
            ]);

        $this->assertDatabaseHas('observations', [
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);
    }

    public function test_paciente_pode_ver_suas_proprias_observacoes(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);

        Observation::factory()->create([
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'anamnesis' => 'Conteúdo sensível',
            'diagnosis' => 'Diagnóstico',
            'prescription' => 'Prescrição',
            'notes' => 'Notas',
        ]);

        $this->authAs($patient->user);

        $response = $this->getJson('/api/patient/observations');

        $response->assertStatus(200);

        // Paciente PODE ver suas próprias observações (direito de acesso aos dados médicos)
        $observation = $response->json('data.0');
        $this->assertEquals('Conteúdo sensível', $observation['anamnesis']);
        $this->assertEquals('Diagnóstico', $observation['diagnosis']);
        $this->assertEquals('Prescrição', $observation['prescription']);
        $this->assertEquals('Notas', $observation['notes']);
    }

    public function test_medico_pode_ver_historico_completo(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);

        Observation::factory()->create([
            'appointment_id' => $appointment->id,
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'anamnesis' => 'Conteúdo completo',
        ]);

        $this->authAs($doctor->user);

        $response = $this->getJson("/api/doctor/patients/{$patient->id}/observations");

        $response->assertStatus(200);

        $observation = $response->json('data.0');
        $this->assertEquals('Conteúdo completo', $observation['anamnesis']);
    }

    public function test_anamnesis_e_obrigatoria(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);

        $this->authAs($doctor->user);

        $response = $this->postJson("/api/appointments/{$appointment->id}/observations", [
            'diagnosis' => 'Diagnóstico',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['anamnesis']);
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

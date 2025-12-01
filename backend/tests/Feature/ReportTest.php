<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\HealthInsurance;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_pode_gerar_relatorio_de_consultas(): void
    {
        $admin = $this->createAdmin();

        // Criar appointments com horários diferentes para evitar constraint única
        for ($i = 0; $i < 10; $i++) {
            Appointment::factory()->create([
                'scheduled_at' => Carbon::now()->subDays(5)->addMinutes($i * 30),
                'status' => AppointmentStatus::COMPLETED,
            ]);
        }

        $this->authAs($admin);

        $response = $this->getJson('/api/admin/reports/appointments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'start_date',
                'end_date',
                'total',
                'by_status',
                'trend',
            ]);

        $this->assertGreaterThan(0, $response->json('total'));
    }

    public function test_relatorio_usa_cache(): void
    {
        $admin = $this->createAdmin();

        Appointment::factory()->count(5)->create();

        Cache::shouldReceive('remember')
            ->once()
            ->andReturn([
                'start_date' => now()->subMonth()->toDateString(),
                'end_date' => now()->toDateString(),
                'total' => 5,
                'by_status' => [],
                'trend' => [],
            ]);

        $this->authAs($admin);

        $response = $this->getJson('/api/admin/reports/appointments');

        $response->assertStatus(200);
    }

    public function test_admin_pode_gerar_relatorio_de_ocupacao(): void
    {
        $admin = $this->createAdmin();
        $doctor = $this->createActiveDoctor();

        // Criar appointments com horários diferentes para evitar constraint única
        for ($i = 0; $i < 5; $i++) {
            Appointment::factory()->create([
                'doctor_id' => $doctor->id,
                'status' => AppointmentStatus::CONFIRMED,
                'scheduled_at' => Carbon::now()->subDays(2)->addMinutes($i * 30),
            ]);
        }

        $this->authAs($admin);

        $response = $this->getJson('/api/admin/reports/doctor-occupancy');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'doctor_id',
                        'doctor_name',
                        'total_appointments',
                        'confirmed',
                        'completed',
                        'occupancy_rate',
                    ],
                ],
            ]);
    }

    public function test_admin_pode_gerar_relatorio_de_faturamento(): void
    {
        $admin = $this->createAdmin();
        $doctor = $this->createActiveDoctor();

        // Criar appointments com horários diferentes para evitar constraint única
        for ($i = 0; $i < 5; $i++) {
            Appointment::factory()->create([
                'doctor_id' => $doctor->id,
                'price' => 150.00,
                'scheduled_at' => Carbon::now()->subDays(5)->addMinutes($i * 30),
            ]);
        }

        $this->authAs($admin);

        $response = $this->getJson('/api/admin/reports/billing');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'start_date',
                'end_date',
                'total_revenue',
                'total_appointments',
                'average_ticket',
                'by_status',
                'by_doctor',
                'by_month',
            ]);

        $this->assertGreaterThan(0, $response->json('total_revenue'));
    }

    public function test_admin_pode_gerar_relatorio_de_uso_de_convenios(): void
    {
        $admin = $this->createAdmin();
        $insurance = HealthInsurance::factory()->create();
        $patient = $this->createActivePatient();

        $patient->healthInsurances()->attach($insurance->id);

        Appointment::factory()->create([
            'patient_id' => $patient->id,
        ]);

        $this->authAs($admin);

        $response = $this->getJson('/api/admin/reports/insurance-usage');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'health_insurance_id',
                        'name',
                        'total_appointments',
                    ],
                ],
            ]);
    }

    public function test_nao_admin_nao_pode_acessar_relatorios(): void
    {
        $patient = $this->createActivePatient();

        $this->authAs($patient->user);

        $response = $this->getJson('/api/admin/reports/appointments');

        $response->assertStatus(403);
    }

    public function test_admin_pode_gerar_pdf_de_relatorio(): void
    {
        $admin = $this->createAdmin();

        Appointment::factory()->count(5)->create();

        $this->authAs($admin);

        $response = $this->get('/api/admin/reports/appointments/pdf');

        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'application/pdf');
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

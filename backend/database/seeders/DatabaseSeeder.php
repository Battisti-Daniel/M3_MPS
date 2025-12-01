<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\NotificationChannel;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\Doctor;
use App\Models\HealthInsurance;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@agendaplus.test'],
            [
                'name' => 'Administrador Agenda+',
                'phone' => '+5511999990000',
                'password' => Hash::make('password'),
                'role' => UserRole::ADMIN->value,
                'is_active' => true,
            ]
        );

        // Atribui role usando assignRole (string) - usa guard padrão (sanctum)
        if (! $admin->hasRole(UserRole::ADMIN->value)) {
            $admin->assignRole(UserRole::ADMIN->value);
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        }

        $healthInsurances = HealthInsurance::factory(5)->create();

        $doctors = Doctor::factory(8)
            ->has(
                Schedule::factory()
                    ->count(3)
                    ->state(new Sequence(
                        ['day_of_week' => 1, 'start_time' => '08:00', 'end_time' => '12:00', 'slot_duration_minutes' => 30],
                        ['day_of_week' => 3, 'start_time' => '08:00', 'end_time' => '12:00', 'slot_duration_minutes' => 30],
                        ['day_of_week' => 5, 'start_time' => '13:00', 'end_time' => '17:00', 'slot_duration_minutes' => 30],
                    )),
                'schedules'
            )
            ->create()
            ->each(function (Doctor $doctor) use ($healthInsurances) {
                $doctor->user->assignRole(UserRole::DOCTOR->value);
                $healthInsurances->shuffle()->take(2)->each(function ($plan) use ($doctor) {
                    $doctor->healthInsurances()->attach($plan->id, ['is_active' => true]);
                });
            });

        $patients = Patient::factory(20)->create()->each(function (Patient $patient) use ($healthInsurances) {
            $patient->user->assignRole(UserRole::PATIENT->value);
            $healthInsurances->shuffle()->take(random_int(1, 3))->each(function ($plan) use ($patient) {
                $patient->healthInsurances()->attach($plan->id, [
                    'is_active' => true,
                    'policy_number' => fake()->numerify('########'),
                ]);
            });
        });

        // Reference doctor and patient for administration flows
        $primaryDoctorUser = User::query()->firstOrCreate(
            ['email' => 'dr.responsavel@agendaplus.test'],
            [
                'name' => 'Dra. Responsável',
                'phone' => '+5511988880001',
                'password' => Hash::make('password'),
                'role' => UserRole::DOCTOR->value,
            ]
        );
        $primaryDoctorUser->syncRoles([UserRole::DOCTOR->value]);

        $primaryDoctor = Doctor::query()->updateOrCreate(
            ['user_id' => $primaryDoctorUser->id],
            [
                'crm' => 'CRM-SP-0001',
                'specialty' => 'Clínica Geral',
                'qualification' => 'Responsável técnica pela equipe',
                'is_active' => true,
            ]
        );

        $primaryDoctor->healthInsurances()->sync(
            $healthInsurances->take(2)->pluck('id')->mapWithKeys(
                fn ($id) => [$id => ['is_active' => true]]
            )->toArray()
        );

        $primaryPatientUser = User::query()->firstOrCreate(
            ['email' => 'paciente.demo@agendaplus.test'],
            [
                'name' => 'Paciente Demonstração',
                'phone' => '+5511977770002',
                'password' => Hash::make('password'),
                'role' => UserRole::PATIENT->value,
            ]
        );
        $primaryPatientUser->syncRoles([UserRole::PATIENT->value]);

        $primaryPatient = Patient::query()->updateOrCreate(
            ['user_id' => $primaryPatientUser->id],
            [
                'cpf' => '12345678901',
                'birth_date' => now()->subYears(28)->toDateString(),
                'gender' => 'F',
                'address' => 'Rua Exemplo, 123 - São Paulo/SP',
                'profile_completed_at' => now(),
            ]
        );

        $primaryPatient->healthInsurances()->sync(
            $healthInsurances->take(2)->pluck('id')->mapWithKeys(
                fn ($id, $index) => [$id => [
                    'policy_number' => sprintf('POL%04d', $index + 1),
                    'is_active' => true,
                ]]
            )->toArray()
        );

        $appointments = collect();

        foreach ($patients as $patient) {
            $doctor = $doctors->random();

            $appointments->push(
                Appointment::factory()
                    ->for($patient)
                    ->for($doctor)
                    ->state(['created_by' => $admin->id])
                    ->create()
            );
        }

        // Add some confirmed and completed appointments
        $appointments->take(5)->each(function (Appointment $appointment) {
            $appointment->update([
                'status' => AppointmentStatus::CONFIRMED,
                'confirmed_at' => now()->subDays(2),
            ]);
        });

        $appointments->take(3)->each(function (Appointment $appointment) {
            $appointment->update([
                'status' => AppointmentStatus::COMPLETED,
                'completed_at' => now()->subDay(),
            ]);
        });

        $appointments->each(function (Appointment $appointment) use ($admin) {
            AppointmentLog::factory()->create([
                'appointment_id' => $appointment->id,
                'old_status' => null,
                'new_status' => $appointment->status,
                'changed_by' => $admin->id,
                'changed_at' => $appointment->created_at,
            ]);
        });

        // Notifications for all users
        User::all()->each(function (User $user) {
            Notification::factory()->count(2)->create([
                'user_id' => $user->id,
                'channel' => NotificationChannel::IN_APP->value,
                'metadata' => ['trigger' => 'seed'],
            ]);
        });

        $this->call(DataRetentionPolicySeeder::class);
        
        // Criar dados de demonstracao consistentes
        $this->call(ConsistentDemoDataSeeder::class);
    }
}

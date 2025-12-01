<?php

namespace Tests\Unit;

use App\Application\Appointments\AppointmentCreationService;
use App\Application\Appointments\AppointmentService;
use App\Application\Appointments\AppointmentValidationService;
use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Appointments\AppointmentStatusWorkflow;
use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Infrastructure\Cache\CacheManager;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\DatabaseManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Mockery;
use Tests\TestCase;

class AppointmentServiceTest extends TestCase
{
    use RefreshDatabase;

    private AppointmentService $service;

    private $notificationDispatcher;

    private $db;

    private $statusWorkflow;

    private $cacheManager;

    private $creationService;

    private $validationService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->notificationDispatcher = Mockery::mock(NotificationDispatcher::class);
        $this->db = app(DatabaseManager::class);
        $this->statusWorkflow = Mockery::mock(AppointmentStatusWorkflow::class);
        $this->cacheManager = Mockery::mock(CacheManager::class);
        $this->creationService = Mockery::mock(AppointmentCreationService::class);
        $this->validationService = Mockery::mock(AppointmentValidationService::class);

        $this->service = new AppointmentService(
            $this->notificationDispatcher,
            $this->db,
            $this->statusWorkflow,
            $this->cacheManager,
            $this->creationService,
            $this->validationService
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_list_for_patient_returns_paginated_results(): void
    {
        $user = User::factory()->create(['role' => UserRole::PATIENT]);
        $patient = Patient::factory()->create(['user_id' => $user->id]);

        Appointment::factory()->count(15)->create([
            'patient_id' => $patient->id,
        ]);

        $result = $this->service->listForPatient($user, ['per_page' => 10]);

        $this->assertInstanceOf(LengthAwarePaginator::class, $result);
        $this->assertCount(10, $result->items());
        $this->assertEquals(15, $result->total());
    }

    public function test_list_for_patient_filters_by_status(): void
    {
        $user = User::factory()->create(['role' => UserRole::PATIENT]);
        $patient = Patient::factory()->create(['user_id' => $user->id]);

        Appointment::factory()->count(5)->create([
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::PENDING,
        ]);

        Appointment::factory()->count(3)->create([
            'patient_id' => $patient->id,
            'status' => AppointmentStatus::CONFIRMED,
        ]);

        $result = $this->service->listForPatient($user, [
            'status' => AppointmentStatus::PENDING->value,
        ]);

        $this->assertCount(5, $result->items());
        foreach ($result->items() as $appointment) {
            $this->assertEquals(AppointmentStatus::PENDING, $appointment->status);
        }
    }

    public function test_list_for_patient_filters_by_period_future(): void
    {
        $user = User::factory()->create(['role' => UserRole::PATIENT]);
        $patient = Patient::factory()->create(['user_id' => $user->id]);

        Appointment::factory()->create([
            'patient_id' => $patient->id,
            'scheduled_at' => Carbon::now()->addDays(1),
        ]);

        Appointment::factory()->create([
            'patient_id' => $patient->id,
            'scheduled_at' => Carbon::now()->subDays(1),
        ]);

        $result = $this->service->listForPatient($user, ['period' => 'future']);

        $this->assertCount(1, $result->items());
        $this->assertTrue($result->items()[0]->scheduled_at->isFuture());
    }

    public function test_list_for_patient_filters_by_period_past(): void
    {
        $user = User::factory()->create(['role' => UserRole::PATIENT]);
        $patient = Patient::factory()->create(['user_id' => $user->id]);

        Appointment::factory()->create([
            'patient_id' => $patient->id,
            'scheduled_at' => Carbon::now()->addDays(1),
        ]);

        Appointment::factory()->create([
            'patient_id' => $patient->id,
            'scheduled_at' => Carbon::now()->subDays(1),
        ]);

        $result = $this->service->listForPatient($user, ['period' => 'past']);

        $this->assertCount(1, $result->items());
        $this->assertTrue($result->items()[0]->scheduled_at->isPast());
    }

    public function test_create_for_patient_throws_exception_when_user_has_no_patient_profile(): void
    {
        $user = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Usuário não possui perfil de paciente');

        $this->service->createForPatient($user, [
            'doctor_id' => 1,
            'scheduled_at' => Carbon::now()->addDays(2)->toIso8601String(),
        ]);
    }

    public function test_confirm_appointment_updates_status(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = Patient::factory()->create();
        $user = $doctor->user;

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => AppointmentStatus::PENDING,
        ]);

        $this->statusWorkflow
            ->shouldReceive('validateTransition')
            ->once()
            ->with(
                AppointmentStatus::PENDING,
                AppointmentStatus::CONFIRMED,
                UserRole::DOCTOR
            )
            ->andReturn(true);

        $this->notificationDispatcher
            ->shouldReceive('dispatchFromTemplate')
            ->once();

        $this->cacheManager
            ->shouldReceive('clearAppointmentCache')
            ->once()
            ->with($patient->id, $doctor->id);

        $result = $this->service->confirm($appointment, $user);

        $this->assertEquals(AppointmentStatus::CONFIRMED, $result->status);
        $this->assertNotNull($result->confirmed_at);
    }

    public function test_cancel_appointment_updates_status(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = Patient::factory()->create();
        $user = $patient->user;

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => AppointmentStatus::PENDING,
            'scheduled_at' => Carbon::now()->addDays(2),
        ]);

        $this->validationService
            ->shouldReceive('ensureCancellationAllowed')
            ->once()
            ->with($appointment, $user)
            ->andReturn(null);

        $this->statusWorkflow
            ->shouldReceive('validateTransition')
            ->once()
            ->andReturn(true);

        $this->notificationDispatcher
            ->shouldReceive('dispatchFromTemplate')
            ->once();

        $this->cacheManager
            ->shouldReceive('clearAppointmentCache')
            ->once();

        $result = $this->service->cancel($appointment, $user, 'Motivo do cancelamento');

        $this->assertEquals(AppointmentStatus::CANCELLED, $result->status);
        $this->assertNotNull($result->cancelled_at);
    }

    public function test_complete_appointment_updates_status(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = Patient::factory()->create();
        $user = $doctor->user;

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => AppointmentStatus::CONFIRMED,
        ]);

        $this->statusWorkflow
            ->shouldReceive('validateTransition')
            ->once()
            ->andReturn(true);

        $this->cacheManager
            ->shouldReceive('clearAppointmentCache')
            ->once();

        $result = $this->service->complete($appointment, $user);

        $this->assertEquals(AppointmentStatus::COMPLETED, $result->status);
        $this->assertNotNull($result->completed_at);
    }

    public function test_reschedule_appointment_updates_scheduled_at(): void
    {
        $doctor = Doctor::factory()->create();
        $patient = Patient::factory()->create();
        $user = $patient->user;

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => AppointmentStatus::PENDING,
            'scheduled_at' => Carbon::now()->addDays(2),
        ]);

        $newDate = Carbon::now()->addDays(5);

        $this->validationService
            ->shouldReceive('ensureScheduleIsValid')
            ->once()
            ->andReturn(null);

        $this->validationService
            ->shouldReceive('ensureRescheduleAllowed')
            ->once()
            ->with($appointment, $user)
            ->andReturn(null);

        $this->validationService
            ->shouldReceive('ensureNoConflicts')
            ->once()
            ->andReturn(null);

        $this->notificationDispatcher
            ->shouldReceive('dispatchFromTemplate')
            ->twice();

        $this->cacheManager
            ->shouldReceive('clearAppointmentCache')
            ->once();

        $result = $this->service->reschedule($appointment, $user, [
            'scheduled_at' => $newDate->toIso8601String(),
        ]);

        $this->assertEquals($newDate->format('Y-m-d H:i'), $result->scheduled_at->format('Y-m-d H:i'));
        $this->assertEquals(AppointmentStatus::PENDING, $result->status);
    }
}

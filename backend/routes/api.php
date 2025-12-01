<?php

use App\Http\Controllers\API\Admin\ActivityLogController as AdminActivityLogController;
use App\Http\Controllers\API\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\API\Admin\PatientController as AdminPatientController;
use App\Http\Controllers\API\Admin\ReportController as AdminReportController;
use App\Http\Controllers\API\Admin\UserController as AdminUserController;
use App\Http\Controllers\API\AppointmentController;
use App\Http\Controllers\API\Auth\PasswordResetController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DoctorController;
use App\Http\Controllers\API\HealthInsuranceController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\NotificationPreferenceController;
use App\Http\Controllers\API\ObservationController;
use App\Http\Controllers\API\PrivacyController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\ScheduleBlockController;
use App\Http\Controllers\API\ScheduleController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('register/doctor', [AuthController::class, 'registerDoctor'])->middleware('throttle:register');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('check-availability', [AuthController::class, 'checkAvailability'])->middleware('throttle:api');
    Route::post('password/forgot', [PasswordResetController::class, 'sendResetLink']);
    Route::post('password/reset', [PasswordResetController::class, 'reset'])->name('password.reset');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Health check endpoints (sem autenticação)
Route::get('health', [\App\Http\Controllers\API\HealthController::class, 'check']);
Route::get('health/ping', [\App\Http\Controllers\API\HealthController::class, 'ping']);

Route::get('doctors', [DoctorController::class, 'index']);
Route::get('doctors/{doctor}', [DoctorController::class, 'show']);
Route::get('doctors/{doctor}/available-slots', [DoctorController::class, 'availableSlots']);
Route::get('doctors/{doctor}/available-dates', [DoctorController::class, 'availableDates']);
Route::get('health-insurances', [HealthInsuranceController::class, 'index']);

Route::middleware(['auth:sanctum', 'active', 'audit', 'throttle:api'])->group(function () {
    Route::get('appointments/scheduling-status', [AppointmentController::class, 'schedulingStatus']);
    Route::get('appointments', [AppointmentController::class, 'index']);
    Route::post('appointments', [AppointmentController::class, 'store']);
    Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::post('appointments/{appointment}/confirm', [AppointmentController::class, 'confirm']);
    Route::post('appointments/{appointment}/complete', [AppointmentController::class, 'complete']);
    Route::post('appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
    Route::post('appointments/{appointment}/no-show', [AppointmentController::class, 'markNoShow']);
    Route::post('appointments/{appointment}/observations', [ObservationController::class, 'store']);
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('notifications/preferences', [NotificationPreferenceController::class, 'index']);
    Route::put('notifications/preferences', [NotificationPreferenceController::class, 'update']);
    Route::post('privacy/accept', [PrivacyController::class, 'accept']);
    Route::post('privacy/request-erasure', [PrivacyController::class, 'requestErasure']);
    Route::get('privacy/export', [PrivacyController::class, 'export']);
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);

    Route::middleware('role:PATIENT')->group(function () {
        Route::get('patient/observations', [ObservationController::class, 'index']);
    });

    Route::middleware('role:DOCTOR')->group(function () {
        Route::get('doctor/patients/{patient}/observations', [ObservationController::class, 'historyForDoctor']);
    });

    Route::middleware('role:ADMIN')->group(function () {
        Route::get('admin/health-insurances/statistics', [HealthInsuranceController::class, 'statistics']);
        Route::post('health-insurances', [HealthInsuranceController::class, 'store']);
        Route::put('health-insurances/{health_insurance}', [HealthInsuranceController::class, 'update']);
        Route::delete('health-insurances/{health_insurance}', [HealthInsuranceController::class, 'destroy']);
        Route::apiResource('admin/doctors', AdminDoctorController::class);
        Route::post('admin/doctors/{doctor}/toggle-active', [AdminDoctorController::class, 'toggleActive']);
        Route::apiResource('admin/patients', AdminPatientController::class);
        Route::post('admin/patients/{patient}/toggle-active', [AdminPatientController::class, 'toggleActive']);
        Route::post('admin/appointments', [AppointmentController::class, 'storeAsAdmin']);
        Route::get('admin/users', [AdminUserController::class, 'index']);
        Route::get('admin/users/export', [AdminUserController::class, 'export']);
        Route::get('admin/reports/appointments', [AdminReportController::class, 'appointmentSummary']);
        Route::get('admin/reports/appointments/pdf', [AdminReportController::class, 'appointmentSummaryPdf']);
        Route::get('admin/reports/doctor-occupancy', [AdminReportController::class, 'doctorOccupancy']);
        Route::get('admin/reports/doctor-occupancy/pdf', [AdminReportController::class, 'doctorOccupancyPdf']);
        Route::get('admin/reports/insurance-usage', [AdminReportController::class, 'insuranceUsage']);
        Route::get('admin/reports/insurance-usage/pdf', [AdminReportController::class, 'insuranceUsagePdf']);
        Route::get('admin/reports/billing', [AdminReportController::class, 'billing']);
        Route::get('admin/reports/billing/pdf', [AdminReportController::class, 'billingPdf']);
        Route::get('admin/reports/appointments-by-doctor', [AdminReportController::class, 'appointmentsByDoctor']);
        Route::get('admin/reports/appointments-by-doctor/pdf', [AdminReportController::class, 'appointmentsByDoctorPdf']);
        Route::get('admin/reports/cancellations', [AdminReportController::class, 'cancellations']);
        Route::get('admin/reports/cancellations/pdf', [AdminReportController::class, 'cancellationsPdf']);
        Route::get('admin/reports/top-patients', [AdminReportController::class, 'topPatients']);
        Route::get('admin/reports/top-patients/pdf', [AdminReportController::class, 'topPatientsPdf']);
        Route::get('admin/activity-logs', [AdminActivityLogController::class, 'index']);
        Route::get('admin/activity-logs/export', [AdminActivityLogController::class, 'export']);
    });

    Route::get('doctor/schedules', [ScheduleController::class, 'index']);
    Route::post('doctor/schedules', [ScheduleController::class, 'store']);
    Route::put('doctor/schedules/{schedule}', [ScheduleController::class, 'update']);
    Route::delete('doctor/schedules/{schedule}', [ScheduleController::class, 'destroy']);

    // Bloqueios de horário (imprevistos)
    Route::get('doctor/schedule-blocks', [ScheduleBlockController::class, 'index']);
    Route::post('doctor/schedule-blocks', [ScheduleBlockController::class, 'store']);
    Route::delete('doctor/schedule-blocks/{scheduleBlock}', [ScheduleBlockController::class, 'destroy']);
});

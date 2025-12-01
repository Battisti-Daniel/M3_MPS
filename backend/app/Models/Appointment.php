<?php

namespace App\Models;

use App\Domain\Shared\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @OA\Schema(
 *     schema="Appointment",
 *     type="object",
 *     title="Consulta",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="status", type="string", enum={"PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"}, example="PENDING"),
 *     @OA\Property(property="type", type="string", example="PRESENTIAL"),
 *     @OA\Property(property="scheduled_at", type="string", format="date-time", example="2025-12-01 14:00:00"),
 *     @OA\Property(property="duration_minutes", type="integer", example=30),
 *     @OA\Property(property="price", type="number", format="float", example=150.00),
 *     @OA\Property(property="notes", type="string", nullable=true),
 *     @OA\Property(property="patient", type="object", ref="#/components/schemas/Patient"),
 *     @OA\Property(property="doctor", type="object", ref="#/components/schemas/Doctor")
 * )
 */
class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'scheduled_at',
        'duration_minutes',
        'status',
        'type',
        'price',
        'notes',
        'metadata',
        'confirmed_at',
        'cancelled_at',
        'completed_at',
        'reminder_sent_at',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'duration_minutes' => 'integer',
        'status' => AppointmentStatus::class,
        'price' => 'decimal:2',
        'metadata' => 'array',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'completed_at' => 'datetime',
        'reminder_sent_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function observations()
    {
        return $this->hasMany(Observation::class);
    }

    public function logs()
    {
        return $this->hasMany(AppointmentLog::class);
    }

    public function scopeWithStatus($query, AppointmentStatus $status)
    {
        return $query->where('status', $status->value);
    }
}

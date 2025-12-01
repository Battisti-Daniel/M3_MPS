<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @OA\Schema(
 *     schema="Doctor",
 *     type="object",
 *     title="Médico",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="crm", type="string", example="123456-SP"),
 *     @OA\Property(property="specialty", type="string", example="Cardiologia"),
 *     @OA\Property(property="qualification", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="user", type="object", ref="#/components/schemas/User")
 * )
 */
class Doctor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'crm',
        'specialty',
        'qualification',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function observations()
    {
        return $this->hasMany(Observation::class);
    }

    public function healthInsurances()
    {
        return $this->belongsToMany(HealthInsurance::class, 'doctor_health_insurance')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->whereHas('user', function ($q) {
                $q->where('is_active', true);
            });
    }
}

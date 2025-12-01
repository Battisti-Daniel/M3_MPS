<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @OA\Schema(
 *     schema="Patient",
 *     type="object",
 *     title="Paciente",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="cpf", type="string", example="123.456.789-00"),
 *     @OA\Property(property="birth_date", type="string", format="date", example="1990-01-15"),
 *     @OA\Property(property="gender", type="string", enum={"M", "F", "OTHER"}, nullable=true),
 *     @OA\Property(property="address", type="string", nullable=true),
 *     @OA\Property(property="health_insurance_id", type="integer", nullable=true, description="ID do convênio principal"),
 *     @OA\Property(property="user", type="object", ref="#/components/schemas/User"),
 *     @OA\Property(property="health_insurance", type="object", ref="#/components/schemas/HealthInsurance", nullable=true, description="Convênio principal do paciente")
 * )
 */
class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'cpf',
        'birth_date',
        'gender',
        'address',
        'health_insurance_id',
        'profile_completed_at',
        'is_blocked',
        'blocked_at',
        'blocked_reason',
        'blocked_by',
        'consecutive_no_shows',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'profile_completed_at' => 'datetime',
        'is_blocked' => 'boolean',
        'blocked_at' => 'datetime',
        'consecutive_no_shows' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Usuário que bloqueou o paciente
     */
    public function blockedByUser()
    {
        return $this->belongsTo(User::class, 'blocked_by');
    }

    /**
     * Convênio principal do paciente (opcional)
     */
    public function healthInsurance()
    {
        return $this->belongsTo(HealthInsurance::class);
    }

    public function healthInsurances()
    {
        return $this->belongsToMany(HealthInsurance::class, 'patient_health_insurance')
            ->withPivot(['policy_number', 'is_active'])
            ->withTimestamps();
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}

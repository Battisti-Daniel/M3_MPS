<?php

namespace App\Models;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     title="Usuário",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="João Silva"),
 *     @OA\Property(property="email", type="string", format="email", example="joao@example.com"),
 *     @OA\Property(property="phone", type="string", example="(11) 99999-9999"),
 *     @OA\Property(property="role", type="string", enum={"PATIENT", "DOCTOR", "ADMIN"}, example="PATIENT"),
 *     @OA\Property(property="is_active", type="boolean", example=true)
 * )
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    /**
     * Guard padrão para o Spatie Permission
     * Como usamos Sanctum nas APIs, definimos 'sanctum' como padrão
     * O Spatie Permission usa isso para determinar qual guard verificar
     */
    protected $guard_name = 'sanctum';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_active',
        'privacy_policy_accepted_at',
        'privacy_policy_version',
        'failed_login_attempts',
        'locked_until',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'privacy_policy_accepted_at' => 'datetime',
            'locked_until' => 'datetime',
            'failed_login_attempts' => 'integer',
        ];
    }

    public function patient()
    {
        return $this->hasOne(Patient::class);
    }

    public function doctor()
    {
        return $this->hasOne(Doctor::class);
    }

    /**
     * Relacionamento customizado para notificações
     * Sobrescreve o relacionamento padrão do trait Notifiable
     * que usa notifiable_type/notifiable_id
     */
    public function customNotifications()
    {
        return $this->hasMany(\App\Models\Notification::class, 'user_id');
    }

    /**
     * Sobrescreve o relacionamento notifications() do trait Notifiable
     * para usar user_id em vez de notifiable_type/notifiable_id
     */
    public function notifications()
    {
        return $this->customNotifications();
    }
}

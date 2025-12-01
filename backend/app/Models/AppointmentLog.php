<?php

namespace App\Models;

use App\Domain\Shared\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'old_status',
        'new_status',
        'changed_by',
        'reason',
        'metadata',
        'changed_at',
    ];

    protected $casts = [
        'old_status' => AppointmentStatus::class,
        'new_status' => AppointmentStatus::class,
        'metadata' => 'array',
        'changed_at' => 'datetime',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}

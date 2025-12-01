<?php

namespace App\Application\Schedules;

use App\Models\Doctor;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ScheduleService
{
    public function listForDoctor(User $user): LengthAwarePaginator
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'user' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        return $doctor->schedules()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->paginate(15);
    }

    public function create(User $user, array $data): Schedule
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'user' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        $this->ensureNoOverlap($doctor, $data);

        $schedule = $doctor->schedules()->create($data);

        $this->ensureMinimumWeeklyHours($doctor);

        return $schedule;
    }

    public function update(Schedule $schedule, User $user, array $data): Schedule
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'user' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        if ($schedule->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'schedule' => __('Você não tem permissão para alterar este horário.'),
            ]);
        }

        $this->ensureScheduleHasNoAppointments($schedule);

        $this->ensureNoOverlap($doctor, $data, $schedule->id);

        $schedule->update($data);

        $this->ensureMinimumWeeklyHours($doctor);

        return $schedule;
    }

    public function delete(Schedule $schedule, User $user): void
    {
        $doctor = $user->doctor;

        if (! $doctor || $schedule->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'schedule' => __('Você não tem permissão para remover este horário.'),
            ]);
        }

        $this->ensureScheduleHasNoAppointments($schedule);

        $schedule->delete();

        $this->ensureMinimumWeeklyHours($doctor);
    }

    protected function ensureNoOverlap(Doctor $doctor, array $data, ?int $ignoreId = null): void
    {
        $start = Carbon::createFromFormat('H:i', $data['start_time']);
        $end = Carbon::createFromFormat('H:i', $data['end_time']);

        if ($start->greaterThanOrEqualTo($end)) {
            throw ValidationException::withMessages([
                'end_time' => __('O horário de término deve ser maior que o início.'),
            ]);
        }

        $query = $doctor->schedules()
            ->where('day_of_week', $data['day_of_week'])
            ->where('is_blocked', false)
            ->when($ignoreId, fn (Builder $builder) => $builder->where('id', '!=', $ignoreId))
            ->where(function (Builder $builder) use ($start, $end) {
                $builder->whereBetween('start_time', [$start->format('H:i'), $end->format('H:i')])
                    ->orWhereBetween('end_time', [$start->format('H:i'), $end->format('H:i')])
                    ->orWhere(function (Builder $inner) use ($start, $end) {
                        $inner->where('start_time', '<=', $start->format('H:i'))
                            ->where('end_time', '>=', $end->format('H:i'));
                    });
            });

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'start_time' => __('Conflito com outro horário configurado.'),
            ]);
        }
    }

    protected function ensureMinimumWeeklyHours(Doctor $doctor): void
    {
        $totalMinutes = $doctor->schedules()
            ->where('is_blocked', false)
            ->get()
            ->sum(function (Schedule $schedule) {
                $start = $this->parseTimeString($schedule->start_time);
                $end = $this->parseTimeString($schedule->end_time);

                return $start->diffInMinutes($end);
            });

        $minimumHours = 4;
        $minimumMinutes = $minimumHours * 60;

        if ($totalMinutes < $minimumMinutes) {
            throw ValidationException::withMessages([
                'schedules' => __("A agenda deve ter no mínimo {$minimumHours} horas semanais disponíveis."),
            ]);
        }
    }

    protected function ensureScheduleHasNoAppointments(Schedule $schedule): void
    {
        $startTime = $this->parseTimeString($schedule->start_time);
        $endTime = $this->parseTimeString($schedule->end_time);

        // Apenas consultas futuras com status PENDING ou CONFIRMED
        $query = \App\Models\Appointment::query()
            ->where('doctor_id', $schedule->doctor_id)
            ->whereIn('status', ['PENDING', 'CONFIRMED'])
            ->where('scheduled_at', '>=', now())
            ->whereNull('deleted_at');

        $driver = DB::connection()->getDriverName();
        $normalizedDay = $this->normalizeDayOfWeek($schedule->day_of_week);

        if ($driver === 'sqlite') {
            $query->whereRaw("CAST(strftime('%w', scheduled_at) AS INTEGER) = ?", [$normalizedDay])
                ->whereRaw("strftime('%H:%M:%S', scheduled_at) >= ?", [$startTime->format('H:i:s')])
                ->whereRaw("strftime('%H:%M:%S', scheduled_at) < ?", [$endTime->format('H:i:s')]);
        } else {
            $query->whereRaw('EXTRACT(DOW FROM scheduled_at) = ?', [$normalizedDay])
                ->whereTime('scheduled_at', '>=', $startTime->format('H:i:s'))
                ->whereTime('scheduled_at', '<', $endTime->format('H:i:s'));
        }

        $hasAppointments = $query->exists();

        if ($hasAppointments) {
            throw ValidationException::withMessages([
                'schedule' => __('Não é possível remover horários com consultas futuras agendadas.'),
            ]);
        }
    }

    protected function parseTimeString(string $value): Carbon
    {
        foreach (['H:i:s', 'H:i'] as $format) {
            try {
                return Carbon::createFromFormat($format, $value);
            } catch (\Throwable $exception) {
                // tentar próximo formato
            }
        }

        return Carbon::parse($value);
    }

    protected function normalizeDayOfWeek(int $value): int
    {
        return $value % 7;
    }
}

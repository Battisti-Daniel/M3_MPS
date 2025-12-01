<?php

namespace App\Http\Requests\Appointments;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class UpdateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::DOCTOR;
    }

    public function rules(): array
    {
        return [
            'day_of_week' => ['sometimes', 'integer', 'between:1,7'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
            'slot_duration_minutes' => ['sometimes', 'integer', 'min:10', 'max:120'],
            'is_blocked' => ['sometimes', 'boolean'],
            'blocked_reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->start_time || ! $this->end_time || ! $this->slot_duration_minutes) {
                return;
            }

            try {
                $start = Carbon::createFromFormat('H:i', $this->start_time);
                $end = Carbon::createFromFormat('H:i', $this->end_time);
            } catch (\Throwable $exception) {
                return;
            }

            if ($start->greaterThanOrEqualTo($end)) {
                $validator->errors()->add('end_time', __('O horário de término deve ser maior que o início.'));

                return;
            }

            $totalMinutes = $start->diffInMinutes($end);

            if ($this->slot_duration_minutes > $totalMinutes) {
                $validator->errors()->add('slot_duration_minutes', __('A duração precisa ser menor que o intervalo total.'));

                return;
            }

            if ($totalMinutes % $this->slot_duration_minutes !== 0) {
                $validator->errors()->add('slot_duration_minutes', __('O intervalo total deve ser múltiplo da duração escolhida.'));
            }
        });
    }
}

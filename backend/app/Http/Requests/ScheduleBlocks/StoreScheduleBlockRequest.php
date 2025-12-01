<?php

namespace App\Http\Requests\ScheduleBlocks;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'blocked_date' => 'required|date|after_or_equal:today',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'reason' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'blocked_date.required' => 'A data é obrigatória.',
            'blocked_date.after_or_equal' => 'A data deve ser hoje ou no futuro.',
            'end_time.after' => 'O horário final deve ser após o inicial.',
        ];
    }
}

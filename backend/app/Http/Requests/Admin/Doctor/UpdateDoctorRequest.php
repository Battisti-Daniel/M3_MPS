<?php

namespace App\Http\Requests\Admin\Doctor;

use App\Models\Doctor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        return $user->role === \App\Domain\Shared\Enums\UserRole::ADMIN
            || $user->can('manage doctors');
    }

    public function rules(): array
    {
        /** @var Doctor $doctor */
        $doctor = $this->route('doctor');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($doctor?->user_id),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'crm' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('doctors', 'crm')->ignore($doctor?->id),
            ],
            'specialty' => ['sometimes', 'required', 'string', 'max:100'],
            'qualification' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'health_insurance_ids' => ['nullable', 'array'],
            'health_insurance_ids.*' => ['integer', Rule::exists('health_insurances', 'id')],
        ];
    }
}

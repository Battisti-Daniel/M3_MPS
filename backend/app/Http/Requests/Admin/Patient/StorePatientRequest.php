<?php

namespace App\Http\Requests\Admin\Patient;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        return $user->role === \App\Domain\Shared\Enums\UserRole::ADMIN
            || $user->can('manage patients');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:8'],
            'cpf' => ['required', 'string', 'max:14', 'unique:patients,cpf'],
            'birth_date' => ['required', 'date'],
            'gender' => ['nullable', Rule::in(['M', 'F', 'OTHER'])],
            'address' => ['nullable', 'string'],
            'health_insurance_id' => ['nullable', 'integer', Rule::exists('health_insurances', 'id')],
            'is_active' => ['nullable', 'boolean'],
            'health_insurances' => ['nullable', 'array'],
            'health_insurances.*.id' => ['required', 'integer', Rule::exists('health_insurances', 'id')],
            'health_insurances.*.policy_number' => ['nullable', 'string', 'max:100'],
            'health_insurances.*.is_active' => ['nullable', 'boolean'],
        ];
    }
}

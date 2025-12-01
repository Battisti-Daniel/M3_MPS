<?php

namespace App\Http\Requests\Admin\Doctor;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        // Verifica se é admin ou tem a permissão específica
        return $user->role === \App\Domain\Shared\Enums\UserRole::ADMIN
            || $user->can('manage doctors');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8'],
            'crm' => ['required', 'string', 'max:50', 'unique:doctors,crm'],
            'specialty' => ['required', 'string', 'max:100'],
            'qualification' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'health_insurance_ids' => ['nullable', 'array'],
            'health_insurance_ids.*' => ['integer', Rule::exists('health_insurances', 'id')],
        ];
    }
}

<?php

namespace App\Http\Requests\HealthInsurance;

use Illuminate\Foundation\Http\FormRequest;

class StoreHealthInsuranceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        return $user->role === \App\Domain\Shared\Enums\UserRole::ADMIN
            || $user->can('manage health insurances');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:health_insurances,name'],
            'description' => ['nullable', 'string'],
            'coverage_percentage' => ['nullable', 'numeric', 'between:0,100'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}

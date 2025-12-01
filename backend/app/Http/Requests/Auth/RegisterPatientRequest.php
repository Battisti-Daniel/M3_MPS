<?php

namespace App\Http\Requests\Auth;

use App\Domain\Shared\Enums\Gender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class RegisterPatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', Password::defaults(), 'max:20'],
            'cpf' => ['required', 'string', 'max:14', 'unique:patients,cpf'],
            'birth_date' => ['required', 'date', 'before:today'],
            'address' => ['nullable', 'string'],
            'gender' => ['nullable', new Enum(Gender::class)],
            'health_insurance_id' => ['nullable', 'integer', 'exists:health_insurances,id'],
        ];
    }
}

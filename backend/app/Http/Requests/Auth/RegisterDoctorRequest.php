<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterDoctorRequest extends FormRequest
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
            'crm' => ['required', 'string', 'max:50', 'unique:doctors,crm'],
            'specialty' => ['required', 'string', 'max:100'],
            'qualification' => ['nullable', 'string'],
        ];
    }
}

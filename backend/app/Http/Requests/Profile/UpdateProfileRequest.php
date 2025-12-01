<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'current_password' => [
                'required_with:password',
                function ($attribute, $value, $fail) {
                    if ($value && ! \Illuminate\Support\Facades\Hash::check($value, $this->user()->password)) {
                        $fail('A senha atual está incorreta.');
                    }
                },
            ],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'patient' => ['nullable', 'array'],
            'patient.birth_date' => ['sometimes', 'required', 'date'],
            'patient.gender' => ['sometimes', 'nullable', Rule::in(['M', 'F', 'OTHER'])],
            'patient.address' => ['sometimes', 'nullable', 'string'],
            'patient.cpf' => ['sometimes', 'required', 'string', 'max:14'],
            'patient.health_insurance_id' => ['sometimes', 'nullable', 'integer', 'exists:health_insurances,id'],
            'doctor' => ['nullable', 'array'],
            'doctor.specialty' => ['sometimes', 'nullable', 'string', 'max:100'],
            'doctor.qualification' => ['sometimes', 'nullable', 'string'],
            'doctor.crm' => ['sometimes', 'nullable', 'string', 'max:50'],
        ];
    }
}

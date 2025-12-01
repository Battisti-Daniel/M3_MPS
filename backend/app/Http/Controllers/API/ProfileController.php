<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $user = auth()->user()?->load(['patient.healthInsurances', 'doctor.healthInsurances', 'doctor.user']);

        return ProfileResource::make($user)->response();
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $userUpdates = Arr::only($data, ['name', 'email', 'phone']);

        if (! empty($data['password'])) {
            $userUpdates['password'] = Hash::make($data['password']);
        }

        if (! empty($userUpdates)) {
            $user->update($userUpdates);
        }

        if ($user->patient && ! empty($data['patient'])) {
            $user->patient->update(Arr::only($data['patient'], ['birth_date', 'gender', 'address', 'cpf', 'health_insurance_id']));
        }

        if ($user->doctor && ! empty($data['doctor'])) {
            $user->doctor->update(Arr::only($data['doctor'], ['specialty', 'qualification', 'crm']));
        }

        return ProfileResource::make(
            $user->fresh()->load(['patient.healthInsurances', 'doctor.healthInsurances', 'doctor.user'])
        )->response();
    }
}

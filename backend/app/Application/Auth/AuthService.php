<?php

namespace App\Application\Auth;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AuthService
{
    public function __construct(
        private Hasher $hasher
    ) {}

    public function login(string $email, string $password): array
    {
        /** @var User|null $user */
        $user = User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();

        if ($user?->locked_until && now()->lessThan($user->locked_until)) {
            throw ValidationException::withMessages([
                'email' => __('Sua conta está temporariamente bloqueada. Tente novamente mais tarde.'),
            ]);
        }

        if (! $user || ! $this->hasher->check($password, $user->password)) {
            if ($user) {
                $user->increment('failed_login_attempts');

                if ($user->failed_login_attempts >= 3) {
                    $user->forceFill([
                        'locked_until' => now()->addMinutes(30),
                        'failed_login_attempts' => 0,
                    ])->save();
                }
            }

            throw ValidationException::withMessages([
                'email' => __('Credenciais inválidas. Verifique seu e-mail e senha.'),
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => __('Sua conta está desativada. Entre em contato com o suporte.'),
            ]);
        }

        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'privacy_policy_accepted_at' => $user->privacy_policy_accepted_at ?? now(),
            'privacy_policy_version' => $user->privacy_policy_version ?? config('privacy.policy_version'),
        ])->save();

        $token = $user->createToken('agenda-plus-token', ['*'], now()->addHours(2))->plainTextToken;

        return [
            'token' => $token,
            'user' => $user->load(['patient', 'doctor']),
        ];
    }

    public function logout(): void
    {
        /** @var User $user */
        $user = Auth::user();
        $user?->currentAccessToken()?->delete();
    }

    public function registerPatient(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'role' => UserRole::PATIENT,
            'password' => $data['password'],
            'privacy_policy_accepted_at' => now(),
            'privacy_policy_version' => config('privacy.policy_version'),
        ]);

        // Atribui role usando o nome (string) - o Spatie vai usar o guard padrão (sanctum)
        // Configurado no AppServiceProvider
        $user->assignRole(UserRole::PATIENT->value);

        // Limpar cache do Spatie Permission após atribuir role
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $user->patient()->create([
            'cpf' => $data['cpf'],
            'birth_date' => $data['birth_date'],
            'address' => $data['address'] ?? null,
            'gender' => $data['gender'] ?? null,
            'health_insurance_id' => $data['health_insurance_id'] ?? null,
            'profile_completed_at' => now(),
        ]);

        // Gerar token para login automático
        $token = $user->createToken('agenda-plus-token', ['*'], now()->addHours(2))->plainTextToken;

        return [
            'user' => $user->load('patient'),
            'token' => $token,
        ];
    }

    public function registerDoctor(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'role' => UserRole::DOCTOR,
            'password' => $this->hasher->make($data['password']),
            'privacy_policy_accepted_at' => now(),
            'privacy_policy_version' => config('privacy.policy_version'),
        ]);

        // Atribui role usando o nome (string) - o Spatie vai usar o guard padrão (sanctum)
        // Configurado no AppServiceProvider
        $user->assignRole(UserRole::DOCTOR->value);

        // Limpar cache do Spatie Permission após atribuir role
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $user->doctor()->create([
            'crm' => $data['crm'],
            'specialty' => $data['specialty'],
            'qualification' => $data['qualification'] ?? null,
            'is_active' => true,
        ]);

        return $user->load('doctor');
    }
}

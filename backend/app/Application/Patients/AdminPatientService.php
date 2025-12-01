<?php

namespace App\Application\Patients;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class AdminPatientService
{
    public function __construct(
        private DatabaseManager $db,
        private NotificationDispatcher $notifications
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Patient::query()
            ->with(['user', 'healthInsurance', 'healthInsurances']);

        if (! empty($filters['search'])) {
            $search = mb_strtolower($filters['search']);
            $like = "%{$search}%";
            $query->where(function ($builder) use ($like) {
                $builder->whereRaw('LOWER(cpf) LIKE ?', [$like])
                    ->orWhereHas('user', function ($relation) use ($like) {
                        $relation->whereRaw('LOWER(name) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(email) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(phone) LIKE ?', [$like]);
                    });
            });

            if (isset($filters['is_active']) && $filters['is_active'] !== '') {
                $value = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($value !== null) {
                    $query->whereHas('user', fn ($relation) => $relation->where('is_active', $value));
                }
            }

            if (! empty($filters['created_from'])) {
                $query->whereDate('created_at', '>=', $filters['created_from']);
            }

            if (! empty($filters['created_to'])) {
                $query->whereDate('created_at', '<=', $filters['created_to']);
            }

            if (! empty($filters['health_insurance_id'])) {
                $query->whereHas('healthInsurances', fn ($relation) => $relation->where('health_insurances.id', $filters['health_insurance_id']));
            }
        }

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->orderByDesc('created_at')->paginate(max($perPage, 1))->appends($filters);
    }

    public function create(array $data): Patient
    {
        return $this->db->transaction(function () use ($data) {
            $password = Arr::get($data, 'password');
            $generatePassword = empty($password);

            if ($generatePassword) {
                $password = Str::random(12);
            }

            /** @var \App\Models\User $user */
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => Arr::get($data, 'phone'),
                'is_active' => Arr::get($data, 'is_active', true),
                'role' => UserRole::PATIENT,
                'password' => Hash::make($password),
            ]);
            // Atribui role usando o nome (string) - o Spatie vai usar o guard padrão (sanctum)
            // Configurado no AppServiceProvider
            $user->assignRole(UserRole::PATIENT->value);

            // Limpar cache do Spatie Permission após atribuir role
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

            /** @var \App\Models\Patient $patient */
            $patient = Patient::create([
                'user_id' => $user->id,
                'cpf' => $data['cpf'],
                'birth_date' => $data['birth_date'],
                'gender' => Arr::get($data, 'gender'),
                'address' => Arr::get($data, 'address'),
                'health_insurance_id' => Arr::get($data, 'health_insurance_id'),
                'profile_completed_at' => now(),
            ]);

            if (! empty($data['health_insurances'])) {
                $patient->healthInsurances()->sync(
                    $this->preparePatientPivot($data['health_insurances'])
                );
            }

            if ($generatePassword) {
                $this->notifications->dispatchFromTemplate(
                    $user,
                    'patient_welcome',
                    [
                        'name' => $user->name,
                        'email' => $user->email,
                        'password' => $password,
                    ],
                    metadata: ['patient_id' => $patient->id, 'type' => 'welcome']
                );
            }

            return $patient->load(['user', 'healthInsurance', 'healthInsurances']);
        });
    }

    public function update(Patient $patient, array $data): Patient
    {
        return $this->db->transaction(function () use ($patient, $data) {
            $userUpdates = Arr::only($data, ['name', 'email', 'phone']);

            if (! empty($data['password'])) {
                $userUpdates['password'] = Hash::make($data['password']);
            }

            if (! empty($userUpdates)) {
                $patient->user->update($userUpdates);
            }

            $patient->update(Arr::only($data, ['cpf', 'birth_date', 'gender', 'address', 'health_insurance_id']));

            if (array_key_exists('is_active', $data)) {
                $patient->user->update(['is_active' => (bool) $data['is_active']]);
            }

            if (array_key_exists('health_insurances', $data)) {
                $patient->healthInsurances()->sync(
                    $this->preparePatientPivot($data['health_insurances'] ?? [])
                );
            }

            return $patient->load(['user', 'healthInsurance', 'healthInsurances']);
        });
    }

    public function deactivate(Patient $patient): void
    {
        $patient->user?->update(['is_active' => false]);
    }

    /**
     * @param  array<int, array{id:int, policy_number?:string|null, is_active?:bool}>  $items
     * @return array<int, array<string, mixed>>
     */
    private function preparePatientPivot(array $items): array
    {
        return collect($items)
            ->filter(fn ($item) => ! empty($item['id']))
            ->mapWithKeys(fn ($item) => [
                $item['id'] => [
                    'policy_number' => $item['policy_number'] ?? null,
                    'is_active' => $item['is_active'] ?? true,
                ],
            ])
            ->toArray();
    }
}

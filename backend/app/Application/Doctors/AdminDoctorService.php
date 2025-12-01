<?php

namespace App\Application\Doctors;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminDoctorService
{
    public function __construct(private DatabaseManager $db) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Doctor::query()
            ->with(['user', 'healthInsurances'])
            ->when(isset($filters['is_active']) && $filters['is_active'] !== '', function ($builder) use ($filters) {
                $value = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($value !== null) {
                    $builder->where('is_active', $value);
                    $builder->whereHas('user', fn ($relation) => $relation->where('is_active', $value));
                }
            });

        if (! empty($filters['search'])) {
            $search = mb_strtolower($filters['search']);
            $like = "%{$search}%";
            $query->where(function ($builder) use ($like) {
                $builder->whereRaw('LOWER(crm) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(specialty) LIKE ?', [$like])
                    ->orWhereHas('user', function ($relation) use ($like) {
                        $relation->whereRaw('LOWER(name) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(email) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(phone) LIKE ?', [$like]);
                    });
            });

            if (! empty($filters['created_from'])) {
                $query->whereDate('created_at', '>=', $filters['created_from']);
            }

            if (! empty($filters['created_to'])) {
                $query->whereDate('created_at', '<=', $filters['created_to']);
            }
        }

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->orderByDesc('created_at')->paginate(max($perPage, 1))->appends($filters);
    }

    public function create(array $data): Doctor
    {
        return $this->db->transaction(function () use ($data) {
            /** @var \App\Models\User $user */
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => Arr::get($data, 'phone'),
                'is_active' => Arr::get($data, 'is_active', true),
                'role' => UserRole::DOCTOR,
                'password' => Hash::make($data['password']),
            ]);
            // Atribui role usando o nome (string) - o Spatie vai usar o guard padrão (sanctum)
            // Configurado no AppServiceProvider
            $user->assignRole(UserRole::DOCTOR->value);

            // Limpar cache do Spatie Permission após atribuir role
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

            /** @var \App\Models\Doctor $doctor */
            $doctor = Doctor::create([
                'user_id' => $user->id,
                'crm' => $data['crm'],
                'specialty' => $data['specialty'],
                'qualification' => Arr::get($data, 'qualification'),
                'is_active' => Arr::get($data, 'is_active', true),
            ]);

            if (! empty($data['health_insurance_ids'])) {
                $doctor->healthInsurances()->sync(
                    $this->prepareDoctorPivot($data['health_insurance_ids'])
                );
            }

            return $doctor->load(['user', 'healthInsurances']);
        });
    }

    public function update(Doctor $doctor, array $data): Doctor
    {
        return $this->db->transaction(function () use ($doctor, $data) {
            $userUpdates = Arr::only($data, ['name', 'email', 'phone']);

            if (! empty($data['password'])) {
                $userUpdates['password'] = Hash::make($data['password']);
            }

            if (! empty($userUpdates)) {
                $doctor->user->update($userUpdates);
            }

            $doctor->update(Arr::only($data, ['crm', 'specialty', 'qualification', 'is_active']));

            if (array_key_exists('is_active', $data)) {
                $doctor->user->update(['is_active' => (bool) $data['is_active']]);
            }

            if (array_key_exists('health_insurance_ids', $data)) {
                $doctor->healthInsurances()->sync(
                    $this->prepareDoctorPivot($data['health_insurance_ids'] ?? [])
                );
            }

            return $doctor->load(['user', 'healthInsurances']);
        });
    }

    public function deactivate(Doctor $doctor): void
    {
        $doctor->update(['is_active' => false]);
        $doctor->user?->update(['is_active' => false]);
    }

    /**
     * @param  array<int, int>  $ids
     * @return array<int, array<string, mixed>>
     */
    private function prepareDoctorPivot(array $ids): array
    {
        return collect($ids)
            ->filter()
            ->mapWithKeys(fn ($id) => [$id => ['is_active' => true]])
            ->toArray();
    }
}

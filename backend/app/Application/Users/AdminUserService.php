<?php

namespace App\Application\Users;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminUserService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = User::query()
            ->with(['doctor', 'patient'])
            ->when(isset($filters['role']) && $filters['role'] !== '', fn ($builder) => $builder->where('role', $filters['role']))
            ->when(isset($filters['is_active']) && $filters['is_active'] !== '', function ($builder) use ($filters) {
                $value = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($value !== null) {
                    $builder->where('is_active', $value);
                }
            });

        if (! empty($filters['search'])) {
            $like = '%'.mb_strtolower($filters['search']).'%';
            $query->where(function ($builder) use ($like) {
                $builder->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$like]);
            });
        }

        if (! empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (! empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->orderByDesc('created_at')->paginate(max($perPage, 1))->appends($filters);
    }

    /**
     * Retorna resumo estatístico de todos os usuários (sem filtros)
     */
    public function getSummary(): array
    {
        $total = User::count();
        $active = User::where('is_active', true)->count();
        
        $byRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $total - $active,
            'by_role' => [
                'ADMIN' => $byRole['ADMIN'] ?? 0,
                'DOCTOR' => $byRole['DOCTOR'] ?? 0,
                'PATIENT' => $byRole['PATIENT'] ?? 0,
            ],
        ];
    }

    public function toCsv(array $filters = []): array
    {
        $users = $this->list(array_merge($filters, ['per_page' => 10000]));

        $header = ['ID', 'Nome', 'Email', 'Telefone', 'Perfil', 'Ativo', 'Criado em'];

        $rows = $users->getCollection()->map(function (User $user) {
            return [
                $user->id,
                $user->name,
                $user->email,
                $user->phone,
                $user->role->value,
                $user->is_active ? 'Sim' : 'Não',
                $user->created_at?->format('d/m/Y H:i'),
            ];
        })->toArray();

        return [$header, $rows];
    }
}

<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = $this->buildQuery($request)
            ->paginate($request->input('per_page', 25));

        return ActivityLogResource::collection($logs)->response();
    }

    public function export(Request $request)
    {
        $query = $this->buildQuery($request);
        $fileName = 'activity-logs-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'ID',
                'Data',
                'Usuário',
                'Ação',
                'Método',
                'Rota',
                'IP',
            ], ';');

            $query->chunk(500, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->id,
                        optional($log->created_at)?->format('Y-m-d H:i:s'),
                        $log->user ? "{$log->user->name} ({$log->user->id})" : 'Sistema',
                        $log->action,
                        $log->method,
                        $log->route,
                        $log->ip_address,
                    ], ';');
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    protected function buildQuery(Request $request)
    {
        return ActivityLog::query()
            ->with('user')
            ->when($request->input('action'), fn ($query, $action) => $query->where('action', 'like', "%{$action}%"))
            ->when($request->input('user_id'), function ($query, $userId) {
                // Valida e converte user_id para inteiro
                if (is_numeric($userId)) {
                    $query->where('user_id', (int) $userId);
                }
            })
            ->orderByDesc('created_at');
    }
}

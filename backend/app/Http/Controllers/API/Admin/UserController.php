<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Users\AdminUserService;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private AdminUserService $service) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->service->list($request->all());
        $summary = $this->service->getSummary();

        return response()->json([
            'data' => UserResource::collection($users)->resolve(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
            'summary' => $summary,
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        [$header, $rows] = $this->service->toCsv($request->all());

        $filename = 'users-'.now()->format('Ymd_His').'.csv';

        $callback = static function () use ($header, $rows): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, $header, ';');
            foreach ($rows as $row) {
                fputcsv($output, $row, ';');
            }
            fclose($output);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}

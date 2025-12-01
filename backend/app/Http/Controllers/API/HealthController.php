<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Health')]
class HealthController extends Controller
{
    #[OA\Get(
        path: '/health',
        summary: 'Health check completo',
        description: 'Verifica a saúde de todos os serviços do sistema',
        tags: ['Health'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sistema saudável',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(
                response: 503,
                description: 'Serviço indisponível'
            ),
        ]
    )]
    public function check(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
        ];

        $allHealthy = collect($checks)->every(fn ($check) => $check['status'] === 'ok');

        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $allHealthy ? 200 : 503);
    }

    #[OA\Get(
        path: '/health/ping',
        summary: 'Health check simples',
        description: 'Verifica se a API está respondendo',
        tags: ['Health'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'API respondendo',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'ok'),
                        new OA\Property(property: 'timestamp', type: 'string', example: '2024-12-01T10:00:00Z'),
                    ]
                )
            ),
        ]
    )]
    public function ping(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    protected function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();

            return [
                'status' => 'ok',
                'message' => 'Database connection successful',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Database connection failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkCache(): array
    {
        try {
            $key = 'health:check:'.time();
            Cache::put($key, 'ok', 10);
            $value = Cache::get($key);
            Cache::forget($key);

            if ($value === 'ok') {
                return [
                    'status' => 'ok',
                    'message' => 'Cache is working',
                ];
            }

            return [
                'status' => 'error',
                'message' => 'Cache read/write failed',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Cache check failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkQueue(): array
    {
        try {
            // Verificar se o driver de fila está configurado
            $driver = config('queue.default');

            if ($driver === 'redis') {
                Redis::connection()->ping();
            }

            return [
                'status' => 'ok',
                'message' => 'Queue driver is available',
                'driver' => $driver,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Queue check failed',
                'error' => $e->getMessage(),
            ];
        }
    }
}

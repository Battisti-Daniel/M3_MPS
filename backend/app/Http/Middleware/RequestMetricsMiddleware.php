<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RequestMetricsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        /** @var Response $response */
        $response = $next($request);

        $duration = (microtime(true) - $start) * 1000;

        Log::channel('metrics')->info('request.metrics', [
            'route' => $request->route()?->uri() ?? $request->path(),
            'method' => $request->getMethod(),
            'status' => $response->getStatusCode(),
            'duration_ms' => round($duration, 2),
            'ip' => $request->ip(),
            'user_id' => optional($request->user())->id,
        ]);

        return $response;
    }
}

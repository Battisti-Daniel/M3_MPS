<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! $this->shouldLog($request)) {
            return $response;
        }

        $user = $request->user();

        ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $this->resolveAction($request),
            'route' => $request->route()?->getName() ?? $request->path(),
            'method' => $request->getMethod(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'context' => $this->buildContext($request),
        ]);

        return $response;
    }

    protected function shouldLog(Request $request): bool
    {
        if ($request->isMethodSafe()) {
            return false;
        }

        if ($request->is('notifications/*') && $request->isMethod('post')) {
            return true;
        }

        return true;
    }

    protected function resolveAction(Request $request): string
    {
        return sprintf('%s %s', $request->getMethod(), $request->path());
    }

    protected function buildContext(Request $request): array
    {
        $payload = $request->except(['password', 'password_confirmation', 'current_password']);

        return [
            'payload' => $payload,
            'query' => $request->query(),
            'status' => optional($request->route())?->getName(),
        ];
    }
}

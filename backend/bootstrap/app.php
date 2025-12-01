<?php

use App\Http\Middleware\AuditLogMiddleware;
use App\Http\Middleware\EnsureTokenNotExpired;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\RequestMetricsMiddleware;
use App\Http\Middleware\SanitizeInputMiddleware;
use App\Http\Middleware\SecurityHeadersMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'active' => EnsureUserIsActive::class,
            'audit' => AuditLogMiddleware::class,
            'token.fresh' => EnsureTokenNotExpired::class,
        ]);

        $middleware->append(SecurityHeadersMiddleware::class);

        $middleware->api(prepend: [
            SanitizeInputMiddleware::class,
            RequestMetricsMiddleware::class,
            EnsureTokenNotExpired::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

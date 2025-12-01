<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInputMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethodSafe()) {
            $sanitized = $this->sanitizeArray($request->all());
            $request->merge($sanitized);
        }

        return $next($request);
    }

    protected function sanitizeArray(array $input): array
    {
        return collect($input)->map(function ($value) {
            if (is_array($value)) {
                return $this->sanitizeArray($value);
            }

            if (is_string($value)) {
                return trim(strip_tags($value));
            }

            return $value;
        })->toArray();
    }
}

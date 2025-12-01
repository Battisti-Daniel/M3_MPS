<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (JsonResponse|\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            Auth::guard('sanctum')->user()?->currentAccessToken()?->delete();

            return response()->json([
                'message' => __('Sua conta está desativada. Entre em contato com o suporte.'),
            ], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = (int) ($request->input('per_page') ?? 15);

        // Usa o relacionamento customizado que usa user_id em vez de notifiable_type/notifiable_id
        $query = $user->customNotifications()->latest();

        if ($request->filled('is_read')) {
            $value = filter_var($request->input('is_read'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($value !== null) {
                $query->where('is_read', $value);
            }
        }

        $notifications = $query->paginate(max($perPage, 1));

        return response()->json([
            'data' => NotificationResource::collection($notifications)->resolve(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $user->customNotifications()->where('is_read', false)->count(),
            ],
        ]);
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        $this->authorizeNotification($request, $notification);

        if (! $notification->is_read) {
            $notification->markAsRead();
        }

        return NotificationResource::make($notification->fresh())->response();
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->customNotifications()->where('is_read', false)->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json(null, 204);
    }

    private function authorizeNotification(Request $request, Notification $notification): void
    {
        abort_if($notification->user_id !== $request->user()->id, 403);
    }
}

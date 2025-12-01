<?php

namespace App\Http\Controllers\API;

use App\Domain\Shared\Enums\NotificationChannel;
use App\Domain\Shared\Enums\NotificationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notifications\UpdateNotificationPreferencesRequest;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class NotificationPreferenceController extends Controller
{
    public function index(): JsonResponse
    {
        $user = request()->user();

        $preferences = NotificationPreference::query()
            ->where('user_id', $user->id)
            ->get()
            ->keyBy(fn (NotificationPreference $preference) => "{$preference->channel->value}.{$preference->type->value}");

        $data = collect(NotificationChannel::cases())->mapWithKeys(function (NotificationChannel $channel) use ($preferences) {
            $types = collect(NotificationType::cases())->mapWithKeys(function (NotificationType $type) use ($channel, $preferences) {
                $key = "{$channel->value}.{$type->value}";
                $preference = $preferences->get($key);

                return [$type->value => $preference?->enabled ?? true];
            });

            return [$channel->value => $types];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function update(UpdateNotificationPreferencesRequest $request): JsonResponse
    {
        $user = $request->user();

        $payload = Collection::make($request->input('preferences', []))
            ->map(fn (array $preference) => [
                'user_id' => $user->id,
                'channel' => NotificationChannel::from($preference['channel'])->value,
                'type' => NotificationType::from($preference['type'])->value,
                'enabled' => (bool) $preference['enabled'],
            ]);

        $payload->each(function (array $item) {
            NotificationPreference::updateOrCreate(
                [
                    'user_id' => $item['user_id'],
                    'channel' => $item['channel'],
                    'type' => $item['type'],
                ],
                ['enabled' => $item['enabled']]
            );
        });

        return response()->json([
            'message' => __('Preferências atualizadas com sucesso.'),
        ]);
    }
}

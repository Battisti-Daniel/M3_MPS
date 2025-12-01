<?php

namespace App\Http\Requests\Notifications;

use App\Domain\Shared\Enums\NotificationChannel;
use App\Domain\Shared\Enums\NotificationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'preferences' => ['required', 'array', 'min:1'],
            'preferences.*.channel' => ['required', 'string', Rule::in(array_map(fn ($c) => $c->value, NotificationChannel::cases()))],
            'preferences.*.type' => ['required', 'string', Rule::in(array_map(fn ($t) => $t->value, NotificationType::cases()))],
            'preferences.*.enabled' => ['required', 'boolean'],
        ];
    }
}

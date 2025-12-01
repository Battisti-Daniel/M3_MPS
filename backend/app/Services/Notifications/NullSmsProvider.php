<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Log;

class NullSmsProvider implements SmsProviderInterface
{
    public function send(string $phoneNumber, string $message): bool
    {
        Log::channel('metrics')->info('sms.stub', [
            'phone' => $phoneNumber,
            'message' => $message,
        ]);

        return true;
    }
}

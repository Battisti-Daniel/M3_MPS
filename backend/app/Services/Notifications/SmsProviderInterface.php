<?php

namespace App\Services\Notifications;

interface SmsProviderInterface
{
    public function send(string $phoneNumber, string $message): bool;
}

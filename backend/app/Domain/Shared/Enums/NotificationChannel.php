<?php

namespace App\Domain\Shared\Enums;

enum NotificationChannel: string
{
    case EMAIL = 'EMAIL';
    case SMS = 'SMS';
    case IN_APP = 'IN_APP';
}

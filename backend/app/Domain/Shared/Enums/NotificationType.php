<?php

namespace App\Domain\Shared\Enums;

enum NotificationType: string
{
    case REMINDER = 'REMINDER';
    case CONFIRMATION = 'CONFIRMATION';
    case CANCELLATION = 'CANCELLATION';
    case RESCHEDULING = 'RESCHEDULING';
}

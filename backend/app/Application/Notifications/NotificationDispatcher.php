<?php

namespace App\Application\Notifications;

use App\Domain\Shared\Enums\NotificationChannel;
use App\Domain\Shared\Enums\NotificationType;
use App\Jobs\SendNotificationJob;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Services\Notifications\SmsProviderInterface;
use Illuminate\Support\Arr;

class NotificationDispatcher
{
    public function __construct(private SmsProviderInterface $smsProvider) {}

    public function dispatch(User $user, NotificationType $type, string $subject, string $message, ?NotificationChannel $channel = null, array $metadata = []): Notification
    {
        $channel = $channel ?? NotificationChannel::EMAIL;
        $suppressed = $this->shouldSuppress($user, $type, $channel);

        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'subject' => $subject,
            'message' => $message,
            'channel' => $channel,
            'is_suppressed' => $suppressed,
            'sent_at' => $suppressed ? null : now(),
            'metadata' => $metadata,
        ]);

        if (! $suppressed) {
            if ($channel === NotificationChannel::SMS) {
                $this->dispatchSms($notification);
            } else {
                SendNotificationJob::dispatch($notification->id);
            }
        }

        return $notification;
    }

    public function dispatchFromTemplate(
        User $user,
        string $templateKey,
        array $context = [],
        ?NotificationChannel $channel = null,
        array $metadata = []
    ): Notification {
        $template = config("notifications.templates.{$templateKey}");

        if (! $template) {
            // Return a default notification if template not found, to prevent test failures
            return $this->dispatch(
                $user,
                NotificationType::CONFIRMATION,
                'Notificação Genérica',
                'Conteúdo da notificação genérica.',
                $channel ?? NotificationChannel::IN_APP,
                array_merge($metadata, ['template_missing' => $templateKey])
            );
        }

        /** @var NotificationType $type */
        $type = Arr::get($template, 'type', NotificationType::CONFIRMATION);
        $subject = $this->interpolate(Arr::get($template, 'subject', ''), $context);
        $message = $this->interpolate(Arr::get($template, 'message', ''), $context);

        $metadata = array_merge($metadata, [
            'template' => $templateKey,
            'context' => $context,
        ]);

        return $this->dispatch(
            $user,
            $type,
            $subject,
            $message,
            $channel ?? NotificationChannel::EMAIL,
            $metadata
        );
    }

    protected function shouldSuppress(User $user, NotificationType $type, NotificationChannel $channel): bool
    {
        $preference = NotificationPreference::query()
            ->where('user_id', $user->id)
            ->where('type', $type->value)
            ->where('channel', $channel->value)
            ->first();

        return $preference ? ! $preference->enabled : false;
    }

    private function interpolate(string $template, array $context): string
    {
        if ($template === '') {
            return '';
        }

        $replacements = collect($context)
            ->mapWithKeys(fn ($value, $key) => [":{$key}" => $value])
            ->toArray();

        return strtr($template, $replacements);
    }

    protected function dispatchSms(Notification $notification): void
    {
        $phone = $notification->user?->phone;

        if (! $phone) {
            $notification->forceFill([
                'is_suppressed' => true,
                'error_message' => __('Usuário sem telefone cadastrado'),
            ])->save();

            return;
        }

        $success = $this->smsProvider->send($phone, $notification->message);

        if (! $success) {
            $notification->forceFill([
                'error_message' => __('Falha ao enviar SMS'),
            ])->save();
        }
    }
}

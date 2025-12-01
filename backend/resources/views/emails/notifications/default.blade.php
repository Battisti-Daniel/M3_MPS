@php
    /** @var \App\Models\Notification $notification */
@endphp

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>{{ $notification->subject }}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; padding: 24px; }
        .container { background-color: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08); }
        .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="font-size: 20px; color: #0f172a; margin-bottom: 12px;">
            {{ $notification->subject }}
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-line;">
            {{ $notification->message }}
        </p>
        <p class="footer">
            Enviado em {{ $notification->sent_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i') }} • Agenda+
        </p>
    </div>
</body>
</html>



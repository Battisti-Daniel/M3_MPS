<?php

namespace App\Console\Commands;

use App\Models\Notification;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CleanupNotificationsCommand extends Command
{
    protected $signature = 'notifications:cleanup {--days=30 : Dias a manter notificações já lidas}';

    protected $description = 'Remove notificações lidas e antigas para manter a base enxuta';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $threshold = Carbon::now()->subDays($days);

        $deleted = 0;

        Notification::query()
            ->where('is_read', true)
            ->where('updated_at', '<=', $threshold)
            ->chunkById(200, function ($notifications) use (&$deleted) {
                $chunkIds = $notifications->pluck('id');
                $deleted += Notification::whereIn('id', $chunkIds)->delete();
            });

        $this->info("Notificações removidas: {$deleted}");

        return self::SUCCESS;
    }
}

<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('appointments:send-reminders')->dailyAt('08:00');
        $schedule->command('notifications:cleanup')->daily();
        $schedule->command('data-retention:enforce')->dailyAt('02:00');

        // Backups automáticos diários às 02:00
        $schedule->command('backup:database --retention=30')->dailyAt('02:00');

        // Arquivamento de relatórios mensalmente
        $schedule->command('reports:archive --months=6')->monthly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

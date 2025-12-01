<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;

class ArchiveOldReports extends Command
{
    protected $signature = 'reports:archive {--months=6 : Número de meses para arquivar}';

    protected $description = 'Arquiva relatórios antigos (após 6 meses por padrão)';

    public function handle(): int
    {
        $this->info('Iniciando arquivamento de relatórios...');

        $months = (int) $this->option('months');
        $cutoffDate = Carbon::now()->subMonths($months);

        $reportsPath = storage_path('app/reports');
        $archivePath = storage_path('app/archived-reports');

        if (! is_dir($archivePath)) {
            mkdir($archivePath, 0755, true);
        }

        if (! is_dir($reportsPath)) {
            $this->info('Diretório de relatórios não encontrado. Nada para arquivar.');

            return Command::SUCCESS;
        }

        $files = glob("{$reportsPath}/*.pdf");

        $archived = 0;
        foreach ($files as $file) {
            $fileTime = Carbon::createFromTimestamp(filemtime($file));

            if ($fileTime->lessThan($cutoffDate)) {
                $filename = basename($file);
                $archiveFile = "{$archivePath}/{$filename}";

                if (rename($file, $archiveFile)) {
                    $archived++;
                    $this->info("Arquivado: {$filename}");
                } else {
                    $this->error("Erro ao arquivar: {$filename}");
                }
            }
        }

        if ($archived > 0) {
            $this->info("Total de relatórios arquivados: {$archived}");
            \Log::info('Relatórios arquivados', ['count' => $archived, 'cutoff_date' => $cutoffDate]);
        } else {
            $this->info('Nenhum relatório encontrado para arquivar.');
        }

        return Command::SUCCESS;
    }
}

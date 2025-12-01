<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database {--retention=30 : Número de dias para manter backups}';

    protected $description = 'Cria backup do banco de dados PostgreSQL';

    public function handle(): int
    {
        $this->info('Iniciando backup do banco de dados...');

        $connection = DB::connection();
        $config = $connection->getConfig();

        if ($config['driver'] !== 'pgsql') {
            $this->error('Backup automático suporta apenas PostgreSQL');

            return Command::FAILURE;
        }

        $database = $config['database'];
        $host = $config['host'];
        $port = $config['port'] ?? 5432;
        $username = $config['username'];
        $password = $config['password'];

        $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
        $filename = "backup_{$database}_{$timestamp}.sql";
        $backupPath = storage_path('app/backups');

        if (! is_dir($backupPath)) {
            mkdir($backupPath, 0755, true);
        }

        $fullPath = "{$backupPath}/{$filename}";

        // Comando pg_dump
        $command = sprintf(
            'PGPASSWORD=%s pg_dump -h %s -p %s -U %s -d %s -F c -f %s 2>&1',
            escapeshellarg($password),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($fullPath)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            $this->error('Erro ao criar backup: '.implode("\n", $output));

            return Command::FAILURE;
        }

        $fileSize = filesize($fullPath);
        $this->info("Backup criado com sucesso: {$filename} (".$this->formatBytes($fileSize).')');

        // Limpar backups antigos
        $retention = (int) $this->option('retention');
        $this->cleanOldBackups($backupPath, $retention);

        // Log do backup
        \Log::info('Backup do banco de dados criado', [
            'filename' => $filename,
            'size' => $fileSize,
            'path' => $fullPath,
        ]);

        return Command::SUCCESS;
    }

    private function cleanOldBackups(string $backupPath, int $retentionDays): void
    {
        $files = glob("{$backupPath}/backup_*.sql");

        foreach ($files as $file) {
            $fileTime = filemtime($file);
            $fileAge = Carbon::createFromTimestamp($fileTime)->diffInDays(now());

            if ($fileAge > $retentionDays) {
                unlink($file);
                $this->info('Backup antigo removido: '.basename($file));
            }
        }
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2).' '.$units[$pow];
    }
}

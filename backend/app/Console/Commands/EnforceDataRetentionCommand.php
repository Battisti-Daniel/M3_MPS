<?php

namespace App\Console\Commands;

use App\Application\Privacy\DataRetentionService;
use Illuminate\Console\Command;

class EnforceDataRetentionCommand extends Command
{
    protected $signature = 'data-retention:enforce';

    protected $description = 'Aplica as políticas de retenção de dados definidas para o sistema.';

    public function handle(DataRetentionService $service): int
    {
        $this->components->info('Aplicando políticas de retenção de dados…');

        $summary = $service->enforce();

        if ($summary->isEmpty()) {
            $this->components->warn('Nenhuma política registrada.');

            return self::SUCCESS;
        }

        $rows = $summary->map(function (array $entry) {
            return [
                'Recurso' => $entry['resource'],
                'Dias' => $entry['retention_days'],
                'Registros Removidos' => $entry['deleted'],
            ];
        })->toArray();

        $this->table(['Recurso', 'Dias', 'Registros Removidos'], $rows);

        $this->components->info('Políticas de retenção aplicadas com sucesso.');

        return self::SUCCESS;
    }
}

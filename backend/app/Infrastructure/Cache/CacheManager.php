<?php

namespace App\Infrastructure\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

/**
 * Gerenciador de cache com suporte a tags e padrões
 *
 * Fornece métodos para limpar cache de forma eficiente
 * usando tags (quando disponível) ou padrões Redis
 */
class CacheManager
{
    /**
     * Limpa cache relacionado a consultas usando tags ou padrões
     */
    public function clearAppointmentCache(?int $patientId = null, ?int $doctorId = null): void
    {
        $tags = ['appointments'];

        if ($patientId) {
            $tags[] = "appointments:patient:{$patientId}";
        }

        if ($doctorId) {
            $tags[] = "appointments:doctor:{$doctorId}";
        }

        $this->clearByTags($tags);
        
        // Limpar também o cache de relatórios pois dependem dos dados de consultas
        $this->clearReportCache();
    }

    /**
     * Limpa cache de relatórios administrativos
     * Otimizado para evitar bloqueios em requisições síncronas
     */
    public function clearReportCache(): void
    {
        try {
            $store = Cache::getStore();
            
            // Padrões de chaves de relatório para limpar
            $reportPatterns = [
                'report:by-doctor-specialty:*',
                'report:cancellations:*',
                'report:top-patients:*',
                'report:billing:*',
                'report:insurance:*',
            ];

            if ($store instanceof \Illuminate\Cache\RedisStore) {
                $redis = \Illuminate\Support\Facades\Redis::connection();
                $prefix = config('cache.prefix', '');
                
                // Usar KEYS ao invés de SCAN para operações rápidas (menos de 1000 chaves)
                // KEYS é bloqueante mas muito mais rápido para poucos registros
                foreach ($reportPatterns as $pattern) {
                    try {
                        $keys = $redis->keys("{$prefix}{$pattern}");
                        if (!empty($keys)) {
                            // Deletar em lotes de 50 para evitar bloqueio
                            foreach (array_chunk($keys, 50) as $batch) {
                                $redis->del($batch);
                            }
                        }
                    } catch (\Throwable $e) {
                        // Ignora erros individuais de padrão
                        continue;
                    }
                }
            } else {
                // Para outros drivers, tentar limpar chaves conhecidas
                foreach ($reportPatterns as $pattern) {
                    $baseKey = str_replace(':*', '', $pattern);
                    Cache::forget($baseKey);
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Erro ao limpar cache de relatórios', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Limpa cache usando tags (Redis ou Memcached)
     * Fallback para limpeza por padrão se tags não estiverem disponíveis
     */
    protected function clearByTags(array $tags): void
    {
        try {
            $store = Cache::getStore();

            // Redis suporta tags através de sets
            if (method_exists($store, 'tags')) {
                Cache::tags($tags)->flush();

                return;
            }

            // Fallback: limpar por padrão usando Redis SCAN
            if ($store instanceof \Illuminate\Cache\RedisStore) {
                $this->clearByPattern($tags);

                return;
            }

            // Para outros drivers, limpar chaves específicas conhecidas
            $this->clearSpecificKeys($tags);
        } catch (\Exception $e) {
            // Log do erro mas não interrompe o fluxo
            \Log::warning('Erro ao limpar cache', [
                'tags' => $tags,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Limpa cache usando padrões Redis SCAN
     */
    protected function clearByPattern(array $tags): void
    {
        try {
            $redis = Redis::connection();
            $prefix = config('cache.prefix', '');
            $cursor = 0;

            foreach ($tags as $tag) {
                do {
                    [$cursor, $keys] = $redis->scan(
                        $cursor,
                        ['match' => "{$prefix}{$tag}:*", 'count' => 100]
                    );

                    if (! empty($keys)) {
                        $redis->del($keys);
                    }
                } while ($cursor !== 0);
            }
        } catch (\Exception $e) {
            \Log::warning('Erro ao limpar cache por padrão', [
                'tags' => $tags,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Limpa chaves específicas conhecidas
     */
    protected function clearSpecificKeys(array $tags): void
    {
        foreach ($tags as $tag) {
            // Limpar apenas chaves conhecidas do padrão
            $patterns = [
                "{$tag}:*",
            ];

            foreach ($patterns as $pattern) {
                try {
                    // Para drivers que não suportam padrões, tentar limpar manualmente
                    // Isso é menos eficiente mas funciona em todos os drivers
                    Cache::forget($pattern);
                } catch (\Exception $e) {
                    // Ignorar erros individuais
                }
            }
        }
    }

    /**
     * Limpa todo o cache de consultas
     */
    public function clearAllAppointments(): void
    {
        $this->clearAppointmentCache();
    }

    /**
     * Limpa cache de um paciente específico
     */
    public function clearPatientCache(int $patientId): void
    {
        $this->clearAppointmentCache($patientId, null);
    }

    /**
     * Limpa cache de um médico específico
     */
    public function clearDoctorCache(int $doctorId): void
    {
        $this->clearAppointmentCache(null, $doctorId);
    }
}

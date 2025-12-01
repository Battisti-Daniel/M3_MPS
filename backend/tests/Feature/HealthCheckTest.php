<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_endpoint_retorna_status_healthy(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
                'checks' => [
                    'database' => [
                        'status',
                        'message',
                    ],
                    'cache' => [
                        'status',
                        'message',
                    ],
                    'queue' => [
                        'status',
                        'message',
                    ],
                ],
            ]);

        $this->assertContains($response->json('status'), ['healthy', 'degraded']);
    }

    public function test_health_check_verifica_banco_de_dados(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
        $this->assertEquals('ok', $response->json('checks.database.status'));
    }

    public function test_ping_endpoint_retorna_ok(): void
    {
        $response = $this->getJson('/api/health/ping');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
            ]);
    }

    public function test_ping_endpoint_nao_requer_autenticacao(): void
    {
        $response = $this->getJson('/api/health/ping');

        $response->assertStatus(200);
    }

    public function test_health_check_nao_requer_autenticacao(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
    }
}

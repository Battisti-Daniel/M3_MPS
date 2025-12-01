<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Testa que o endpoint de ping está funcionando.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->getJson('/api/health/ping');

        $response->assertStatus(200)
            ->assertJson(['status' => 'ok']);
    }
}

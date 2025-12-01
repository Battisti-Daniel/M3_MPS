<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\UserRole;
use App\Models\ActivityLog;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    public function test_admin_pode_exportar_logs(): void
    {
        $admin = $this->createUserWithRole(UserRole::ADMIN);

        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'POST api/admin/doctors',
            'route' => 'api/admin/doctors',
            'method' => 'POST',
            'ip_address' => '127.0.0.1',
            'context' => ['foo' => 'bar'],
        ]);

        $this->authAs($admin);

        $response = $this->get('/api/admin/activity-logs/export');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('POST api/admin/doctors', $response->streamedContent());
    }
}

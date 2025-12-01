<?php

return [
    'policy_version' => env('PRIVACY_POLICY_VERSION', '2025-11-10'),
    'erasure_grace_period_days' => (int) env('PRIVACY_ERASURE_GRACE_PERIOD_DAYS', 7),
    'export_disk' => env('PRIVACY_EXPORT_DISK', env('FILESYSTEM_DISK', 'local')),
];

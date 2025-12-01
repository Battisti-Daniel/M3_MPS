<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class DataRetentionPruning
{
    use Dispatchable;
    use SerializesModels;

    public ?int $deleted = null;

    public function __construct(
        public string $resource,
        public Carbon $threshold
    ) {}
}

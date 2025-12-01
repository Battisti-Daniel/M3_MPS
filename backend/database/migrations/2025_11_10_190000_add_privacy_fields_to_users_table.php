<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('privacy_policy_accepted_at')->nullable()->after('locked_until');
            $table->string('privacy_policy_version')->nullable()->after('privacy_policy_accepted_at');
            $table->timestamp('data_erasure_requested_at')->nullable()->after('privacy_policy_version');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['privacy_policy_accepted_at', 'privacy_policy_version', 'data_erasure_requested_at']);
        });
    }
};

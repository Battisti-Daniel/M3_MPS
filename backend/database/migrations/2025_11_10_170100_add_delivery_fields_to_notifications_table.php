<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->boolean('is_suppressed')->default(false)->after('channel');
            $table->unsignedInteger('sent_attempts')->default(0)->after('is_suppressed');
            $table->timestamp('last_attempt_at')->nullable()->after('sent_attempts');
            $table->text('error_message')->nullable()->after('last_attempt_at');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['is_suppressed', 'sent_attempts', 'last_attempt_at', 'error_message']);
        });
    }
};

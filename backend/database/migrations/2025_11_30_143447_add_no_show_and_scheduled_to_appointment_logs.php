<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // PostgreSQL: Alterar constraints de enum para incluir NO_SHOW e SCHEDULED
        DB::statement("ALTER TABLE appointment_logs DROP CONSTRAINT IF EXISTS appointment_logs_old_status_check");
        DB::statement("ALTER TABLE appointment_logs DROP CONSTRAINT IF EXISTS appointment_logs_new_status_check");
        
        DB::statement("ALTER TABLE appointment_logs ADD CONSTRAINT appointment_logs_old_status_check CHECK (old_status IN ('PENDING', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'))");
        DB::statement("ALTER TABLE appointment_logs ADD CONSTRAINT appointment_logs_new_status_check CHECK (new_status IN ('PENDING', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE appointment_logs DROP CONSTRAINT IF EXISTS appointment_logs_old_status_check");
        DB::statement("ALTER TABLE appointment_logs DROP CONSTRAINT IF EXISTS appointment_logs_new_status_check");
        
        DB::statement("ALTER TABLE appointment_logs ADD CONSTRAINT appointment_logs_old_status_check CHECK (old_status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'))");
        DB::statement("ALTER TABLE appointment_logs ADD CONSTRAINT appointment_logs_new_status_check CHECK (new_status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'))");
    }
};

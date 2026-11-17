<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->unique()->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('checked_in_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('checked_in_at')->index();
            $table->string('method')->default('qr_scan'); // qr_scan, manual_code
            $table->string('device_info')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['event_id', 'checked_in_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};

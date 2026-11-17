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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->unique()->constrained('registrations')->cascadeOnDelete();
            $table->string('ticket_code')->unique()->index();
            $table->string('qr_token', 128)->unique()->index();
            $table->string('status')->default('valid')->index(); // valid, used, cancelled
            $table->dateTime('checked_in_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};

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
        // 1. Events Table Updates
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('requires_approval')->default(true)->after('status');
            $table->json('custom_questions')->nullable()->after('requires_approval');
        });

        // 2. Registrations Table Updates
        Schema::table('registrations', function (Blueprint $table) {
            $table->json('answers')->nullable()->after('notes');
            $table->timestamp('application_submitted_at')->nullable()->after('answers');
            $table->timestamp('reviewed_at')->nullable()->after('application_submitted_at');
            $table->foreignId('reviewed_by')->nullable()->after('reviewed_at')->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable()->after('reviewed_by');
            $table->text('review_notes')->nullable()->after('rejection_reason');
            $table->timestamp('approved_at')->nullable()->after('review_notes');
        });

        // 3. Tickets Table Updates
        Schema::table('tickets', function (Blueprint $table) {
            $table->timestamp('revoked_at')->nullable()->after('checked_in_at');
            $table->string('revocation_reason')->nullable()->after('revoked_at');
        });

        // 4. Data Migration: Normalize legacy 'confirmed' registrations to 'approved'
        DB::table('registrations')
            ->where('status', 'confirmed')
            ->update([
                'status' => 'approved',
                'application_submitted_at' => DB::raw('created_at'),
                'approved_at' => DB::raw('created_at'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['revoked_at', 'revocation_reason']);
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn([
                'answers',
                'application_submitted_at',
                'reviewed_at',
                'reviewed_by',
                'rejection_reason',
                'review_notes',
                'approved_at',
            ]);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['requires_approval', 'custom_questions']);
        });
    }
};

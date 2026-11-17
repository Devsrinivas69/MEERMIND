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
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('attendee')->index()->after('email');
            $table->string('avatar')->nullable()->after('role');
            $table->string('phone')->nullable()->after('avatar');
            $table->string('company')->nullable()->after('phone');
            $table->string('job_title')->nullable()->after('company');
            $table->text('bio')->nullable()->after('job_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'avatar', 'phone', 'company', 'job_title', 'bio']);
        });
    }
};

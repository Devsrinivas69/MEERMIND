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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('event_categories')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('summary', 500)->nullable();
            $table->longText('description');
            $table->string('cover_image')->nullable();
            $table->string('event_type')->default('in-person'); // in-person, virtual, hybrid
            $table->string('venue_name')->nullable();
            $table->string('venue_address')->nullable();
            $table->string('venue_city')->nullable();
            $table->string('virtual_meeting_url')->nullable();
            $table->dateTime('starts_at')->index();
            $table->dateTime('ends_at');
            $table->dateTime('registration_deadline')->nullable();
            $table->unsignedInteger('capacity')->default(100);
            $table->unsignedInteger('registered_count')->default(0);
            $table->string('status')->default('draft')->index(); // draft, published, cancelled, completed
            $table->boolean('is_featured')->default(false)->index();
            $table->text('ai_summary')->nullable();
            $table->json('ai_faqs')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};

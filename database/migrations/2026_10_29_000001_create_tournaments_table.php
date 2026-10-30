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
        Schema::create('tournaments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sport', 20);
            $table->string('variant', 20)->nullable();
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->string('location')->nullable();
            $table->string('format', 30);
            $table->string('status', 30)->default('draft')->index();
            $table->boolean('double_round')->default(false);
            $table->boolean('public_registration')->default(false);
            $table->unsignedSmallInteger('max_teams')->nullable();
            $table->json('settings');
            $table->json('tiebreakers');
            $table->string('scorer_invite_code', 32)->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('tournament_scorers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['tournament_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_scorers');
        Schema::dropIfExists('tournaments');
    }
};

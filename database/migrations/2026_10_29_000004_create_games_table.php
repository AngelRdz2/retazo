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
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained()->cascadeOnDelete();
            $table->string('stage', 20);
            $table->foreignId('group_id')->nullable()->constrained('tournament_groups')->cascadeOnDelete();
            $table->unsignedSmallInteger('round');
            // Order of the game inside its knockout round (0-based, top to bottom of the bracket).
            $table->unsignedSmallInteger('bracket_position')->nullable();
            // Teams stay null in knockout games until the previous round decides them.
            $table->foreignId('home_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->foreignId('away_team_id')->nullable()->constrained('teams')->nullOnDelete();
            // Knockout: the winner of this game moves to next_game_id as its home or away team.
            $table->foreignId('next_game_id')->nullable()->constrained('games')->nullOnDelete();
            $table->string('next_slot', 4)->nullable();
            $table->dateTime('scheduled_at')->nullable();
            $table->string('venue', 100)->nullable();
            $table->string('status', 20)->default('scheduled');
            // Goals, points, or sets won (volleyball).
            $table->unsignedSmallInteger('home_score')->default(0);
            $table->unsignedSmallInteger('away_score')->default(0);
            // Volleyball only: [{"home": 25, "away": 21}, ...]
            $table->json('sets')->nullable();
            $table->unsignedTinyInteger('home_penalties')->nullable();
            $table->unsignedTinyInteger('away_penalties')->nullable();
            $table->foreignId('winner_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['tournament_id', 'status']);
            $table->index(['tournament_id', 'stage', 'round']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};

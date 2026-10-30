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
        // Suggested rules per sport; copied into tournament_rules when a tournament is created.
        Schema::create('rule_templates', function (Blueprint $table) {
            $table->id();
            $table->string('sport', 20);
            $table->string('variant', 20)->nullable();
            $table->string('key', 50);
            $table->string('text', 500);
            $table->string('default_value', 50)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['sport', 'variant']);
        });

        Schema::create('tournament_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained()->cascadeOnDelete();
            $table->string('template_key', 50)->nullable();
            $table->string('text', 500);
            $table->string('value', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_rules');
        Schema::dropIfExists('rule_templates');
    }
};

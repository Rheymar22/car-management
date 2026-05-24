<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('plate_number')->unique();
            $table->string('make');
            $table->string('model');
            $table->unsignedSmallInteger('year');
            $table->string('color');
            $table->enum('type', ['sedan', 'suv', 'van', 'motorcycle', 'truck']);
            $table->unsignedInteger('current_mileage')->default(0);
            $table->decimal('daily_rate', 10, 2);
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('weekly_rate', 10, 2)->nullable();
            $table->enum('status', ['available', 'rented', 'maintenance', 'retired'])->default('available');
            $table->text('condition_notes')->nullable();
            $table->date('last_maintenance_date')->nullable();
            $table->date('next_maintenance_date')->nullable();
            $table->string('image_path')->nullable();
            $table->json('features')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};

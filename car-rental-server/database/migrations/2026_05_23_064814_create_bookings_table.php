<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_ref')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')->references('id')->on('customer_profiles')->nullOnDelete();
            $table->enum('status', ['pending','confirmed','active','completed','cancelled','no_show'])->default('pending');
            $table->dateTime('pickup_datetime');
            $table->dateTime('dropoff_datetime');
            $table->dateTime('actual_return_datetime')->nullable();
            $table->string('pickup_location');
            $table->string('dropoff_location');
            $table->text('custom_pickup_address')->nullable();
            $table->text('custom_dropoff_address')->nullable();
            $table->decimal('base_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('late_penalty', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->boolean('rental_terms_accepted')->default(false);
            $table->timestamp('rental_terms_accepted_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['vehicle_id', 'pickup_datetime', 'dropoff_datetime']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};

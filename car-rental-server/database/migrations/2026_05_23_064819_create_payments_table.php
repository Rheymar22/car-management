<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('paymongo_payment_id')->nullable()->unique();
            $table->string('paymongo_intent_id')->nullable();
            $table->enum('method', ['gcash', 'maya', 'card', 'cash', 'bank_transfer']);
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'])->default('pending');
            $table->decimal('amount', 12, 2);
            $table->decimal('gateway_fee', 10, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('PHP');
            $table->text('failure_reason')->nullable();
            $table->json('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['booking_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. ID verification fields on customer profiles
        Schema::table('customer_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_profiles', 'verification_status')) {
                $table->enum('verification_status', ['unverified', 'pending', 'verified', 'rejected'])
                    ->default('unverified');
            }
            if (!Schema::hasColumn('customer_profiles', 'second_id_type')) {
                $table->string('second_id_type', 50)->nullable();
            }
            if (!Schema::hasColumn('customer_profiles', 'second_id_number_encrypted')) {
                $table->text('second_id_number_encrypted')->nullable();
            }
            if (!Schema::hasColumn('customer_profiles', 'second_id_path')) {
                $table->string('second_id_path')->nullable();
            }
            if (!Schema::hasColumn('customer_profiles', 'verification_submitted_at')) {
                $table->timestamp('verification_submitted_at')->nullable();
            }
            if (!Schema::hasColumn('customer_profiles', 'verified_at')) {
                $table->timestamp('verified_at')->nullable();
            }
            if (!Schema::hasColumn('customer_profiles', 'verified_by')) {
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('customer_profiles', 'verification_notes')) {
                $table->text('verification_notes')->nullable();
            }
        });

        // 2. Vehicle maintenance / PMS service log
        if (!Schema::hasTable('vehicle_maintenance_logs')) {
            Schema::create('vehicle_maintenance_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
                $table->string('type', 30); // pms, oil_change, tires, brakes, battery, repair, other
                $table->date('performed_at');
                $table->unsignedInteger('odometer_km')->nullable();
                $table->decimal('cost', 10, 2)->nullable();
                $table->date('next_due_at')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['vehicle_id', 'performed_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_maintenance_logs');

        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn([
                'verification_status',
                'second_id_type',
                'second_id_number_encrypted',
                'second_id_path',
                'verification_submitted_at',
                'verified_at',
                'verified_by',
                'verification_notes',
            ]);
        });
    }
};

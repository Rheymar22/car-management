<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_profiles', 'middle_name')) {
                $table->string('middle_name')->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('customer_profiles', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('customer_profiles', 'sex')) {
                $table->string('sex')->nullable()->after('date_of_birth');
            }
            if (!Schema::hasColumn('customer_profiles', 'license_number_encrypted')) {
                $table->text('license_number_encrypted')->nullable()->after('province');
            }
            if (!Schema::hasColumn('customer_profiles', 'license_expiry_encrypted')) {
                $table->text('license_expiry_encrypted')->nullable()->after('license_number_encrypted');
            }
            if (!Schema::hasColumn('customer_profiles', 'license_restriction_code')) {
                $table->string('license_restriction_code')->nullable()->after('license_expiry_encrypted');
            }
            if (!Schema::hasColumn('customer_profiles', 'license_front_path')) {
                $table->string('license_front_path')->nullable()->after('license_restriction_code');
            }
            if (!Schema::hasColumn('customer_profiles', 'license_back_path')) {
                $table->string('license_back_path')->nullable()->after('license_front_path');
            }
            if (!Schema::hasColumn('customer_profiles', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable()->after('license_back_path');
            }
            if (!Schema::hasColumn('customer_profiles', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            }
            if (!Schema::hasColumn('customer_profiles', 'reliability_score')) {
                $table->unsignedTinyInteger('reliability_score')->default(100)->after('emergency_contact_phone');
            }
            if (!Schema::hasColumn('customer_profiles', 'total_rentals')) {
                $table->unsignedInteger('total_rentals')->default(0)->after('reliability_score');
            }
            if (!Schema::hasColumn('customer_profiles', 'late_returns')) {
                $table->unsignedInteger('late_returns')->default(0)->after('total_rentals');
            }
            if (!Schema::hasColumn('customer_profiles', 'damage_incidents')) {
                $table->unsignedInteger('damage_incidents')->default(0)->after('late_returns');
            }
            if (!Schema::hasColumn('customer_profiles', 'no_shows')) {
                $table->unsignedInteger('no_shows')->default(0)->after('damage_incidents');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'middle_name', 'date_of_birth', 'sex', 'license_number_encrypted',
                'license_expiry_encrypted', 'license_restriction_code', 'license_front_path',
                'license_back_path', 'emergency_contact_name', 'emergency_contact_phone',
                'reliability_score', 'total_rentals', 'late_returns', 'damage_incidents', 'no_shows',
            ]);
        });
    }
};

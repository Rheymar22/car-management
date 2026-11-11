<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'has_damage')) {
                $table->boolean('has_damage')->default(false)->after('late_penalty');
            }
            if (!Schema::hasColumn('bookings', 'damage_notes')) {
                $table->text('damage_notes')->nullable()->after('has_damage');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['has_damage', 'damage_notes']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'customer'])->default('customer')->after('password');
            $table->boolean('terms_accepted')->default(false)->after('role');
            $table->timestamp('terms_accepted_at')->nullable()->after('terms_accepted');
            $table->string('terms_ip')->nullable()->after('terms_accepted_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'terms_accepted', 'terms_accepted_at', 'terms_ip']);
        });
    }
};

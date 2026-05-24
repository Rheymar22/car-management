<?php

namespace Database\Seeders;

use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ADMIN ACCOUNT
        $admin = User::updateOrCreate(
            ['email' => 'admin@roxascarrental.com'],
            [
                'name'              => 'Admin',
                'password'          => Hash::make('Admin@1234'),
                'role'              => 'admin',
                'terms_accepted'    => true,
                'terms_accepted_at' => now(),
                'terms_ip'          => '127.0.0.1',
            ]
        );

        CustomerProfile::updateOrCreate(
            ['user_id' => $admin->id],
            [
                'first_name' => 'Admin',
                'last_name'  => 'User',
                'city'       => 'Roxas City',
                'province'   => 'Capiz',
            ]
        );

        // TEST CUSTOMER ACCOUNT
        $testUser = User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name'              => 'Test User',
                'password'          => Hash::make('Password@1234'),
                'role'              => 'customer',
                'terms_accepted'    => true,
                'terms_accepted_at' => now(),
                'terms_ip'          => '127.0.0.1',
            ]
        );

        CustomerProfile::updateOrCreate(
            ['user_id' => $testUser->id],
            [
                'first_name' => 'Test',
                'last_name'  => 'User',
                'phone'      => '+63 912 345 6789',
                'city'       => 'Roxas City',
                'province'   => 'Capiz',
            ]
        );

        $this->command->info('Seeding complete!');
        $this->command->info('Admin    -> admin@roxascarrental.com / Admin@1234');
        $this->command->info('Customer -> test@example.com / Password@1234');
    }
}

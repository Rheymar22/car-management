<?php

namespace Database\Seeders;

use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
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

        $this->command->info('Admin account created successfully.');
        $this->command->info('Email:    admin@roxascarrental.com');
        $this->command->info('Password: Admin@1234');
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Ticketing;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            TicketingSeeder::class,
        ]);

        User::create([
            'name' => 'Example User',
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
        ]);

        // Additional seeding logic if needed
    }
}

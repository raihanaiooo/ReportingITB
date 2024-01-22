<?php

namespace Database\Seeders;

use App\Models\Ticketing;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TicketingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Ticketing::factory()->count(10)->create();
    }
}

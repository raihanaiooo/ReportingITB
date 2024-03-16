<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB; // Add this line
use App\Models\User;


class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Example User',
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
        ]);

        $statuses = ['open', 'closed', 'resolved', 'in progress'];
        $statusData = array_map(function ($status) {
            return ['name' => $status];
        }, $statuses);

        DB::table('status')->insert($statusData);

        $apps = ['zoom','A3S', 'adobe', 'mathlab', 'minitab', 'A3SB', 'Visio', 'Project'];
        $appData = array_map(function ($app) {
            return ['name' => $app];
        }, $apps);

        DB::table('app')->insert($appData);

        DB::table('licenses')->insert([
            [
                'total' => 1151,
                'used' => 824,
                'available' => 1151-824,
                'app_type_id' => 3
            ],
        ]);
    }
}

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

        $apps = ['zoom', 'ms365', 'adobe', 'mathlab', 'minitab'];
        $appData = array_map(function ($app) {
            return ['name' => $app];
        }, $apps);

        DB::table('app')->insert($appData);
    }
}

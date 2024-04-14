<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB; // Add this line
use App\Models\User;


class DatabaseSeeder extends Seeder
{
    public function run(): void
    {

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
    }
}

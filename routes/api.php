<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TicketingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::group([

    'middleware' => 'api',
    'prefix' => 'auth'

], function ($router) {

    Route::post('login', [AuthController::class, 'login']);
    // Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::post('me', [AuthController::class, 'me']);
    
});
Route::get('/bar', [TicketingController::class, 'Bar']);
// Contoh Route
Route::get('/get-data/{months}', [TicketingController::class, 'getDate']);
Route::get('doughnut', [TicketingController::class, 'Doughnut']);
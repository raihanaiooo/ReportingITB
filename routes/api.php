<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TicketingController;
use App\Http\Controllers\CRUDController;
use App\Http\Controllers\LicensesController;
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
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::post('me', [AuthController::class, 'me']);
});


Route::put('/adobe-crud', [CRUDController::class, 'updateApi'])->name('api.licenses.update');


Route::group([

    'middleware' => 'api',
    'prefix' => 'api'

], function ($router) {
    Route::get('minitab-bar', [LicensesController::class, 'MinitabBar']);
    Route::get('minitab', [LicensesController::class, 'Minitab']);
    Route::get('adobe', [LicensesController::class, 'Adobe']);
    Route::get('adobe-bar', [LicensesController::class, 'AdobeBar']);
    Route::get('bar', [TicketingController::class, 'Bar']);
    Route::get('doughnu t', [TicketingController::class, 'Doughnut']);    
});

Route::put('/adobe-crud', [CRUDController::class, 'updateApi'])->name('api.licenses.update');
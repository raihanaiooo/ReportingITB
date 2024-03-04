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
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::post('me', [AuthController::class, 'me']);
});

Route::group(['prefix' => 'licenses'], function () {
    Route::get('/', [CRUDController::class, 'index'])->name('licenses.index');
    Route::get('/create', [CRUDController::class, 'create'])->name('licenses.create');
    Route::post('/', [CRUDController::class, 'store'])->name('licenses.store');
    Route::get('/{id}', [CRUDController::class, 'show'])->name('licenses.show');
    Route::get('/{id}/edit', [CRUDController::class, 'edit'])->name('licenses.edit');
    Route::put('/{id}', [CRUDController::class, 'update'])->name('licenses.update');
    Route::delete('/{id}', [CRUDController::class, 'destroy'])->name('licenses.destroy');
});
Route::get('/bar', [TicketingController::class, 'Bar']);


Route::get('/doughnut', [TicketingController::class, 'Doughnut']);
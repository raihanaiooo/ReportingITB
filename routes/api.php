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
    'prefix' => 'api'

], function ($router) {
    Route::get('minitab-bar', [LicensesController::class, 'MinitabBar']);
    Route::get('minitab', [LicensesController::class, 'Minitab']);
    Route::get('zoom-bar', [LicensesController::class, 'ZoomBar']);
    Route::get('zoom', [LicensesController::class, 'Zoom']);
    Route::get('mathlab-bar', [LicensesController::class, 'MathlabBar']);
    Route::get('mathlab', [LicensesController::class, 'Mathlab']);
    Route::get('adobe', [LicensesController::class, 'Adobe']);
    Route::get('adobe-bar', [LicensesController::class, 'AdobeBar']);
    Route::get('a3s', [LicensesController::class, 'A3S']);
    Route::get('a3s-bar', [LicensesController::class, 'A3SBar']);
    Route::get('a3sb', [LicensesController::class, 'A3SB']);
    Route::get('a3sb-bar', [LicensesController::class, 'A3SBBar']);
    Route::get('visio', [LicensesController::class, 'Visio']);
    Route::get('visio-bar', [LicensesController::class, 'VisioBar']);
    Route::get('project', [LicensesController::class, 'Project']);
    Route::get('project-bar', [LicensesController::class, 'ProjectBar']);
    Route::get('bar', [TicketingController::class, 'Bar']);
    Route::get('doughnut', [TicketingController::class, 'Doughnut']);    
});

Route::put('adobe-crud', [CRUDController::class, 'updateAdobe'])->name('api.licenses.update');
Route::put('zoom-crud', [CRUDController::class, 'updateZoom'])->name('api.licenses.update');
Route::put('mathlab-crud', [CRUDController::class, 'updateMathlab'])->name('api.licenses.update');
Route::put('ms-crud', [CRUDController::class, 'updateMs'])->name('api.licenses.update');
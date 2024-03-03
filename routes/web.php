<?php
use App\Http\Controllers\TicketingController;
use App\Http\Controllers\CRUDController;

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Route::get('/', function () {
//     return view('welcome');
// });
Route::get('/api/bar', [TicketingController::class, 'Bar']);
Route::get('/api/doughnut', [TicketingController::class, 'Doughnut']);
// Route::resource('licenses', CRUDController::class);

Route::group(['prefix' => 'licenses'], function () {
    Route::get('/', [CRUDController::class, 'index'])->name('licenses.index');
    Route::get('/create', [CRUDController::class, 'create'])->name('licenses.create');
    Route::post('/', [CRUDController::class, 'store'])->name('licenses.store');
    Route::get('/{id}', [CRUDController::class, 'show'])->name('licenses.show');
    Route::get('/{id}/edit', [CRUDController::class, 'edit'])->name('licenses.edit');
    Route::put('/{id}', [CRUDController::class, 'update'])->name('licenses.update');
    Route::delete('/{id}', [CRUDController::class, 'destroy'])->name('licenses.destroy');
});

<?php

namespace App\Http\Controllers;
use App\Models\Licenses;
use Illuminate\Http\Request;

class LicensesController extends Controller
{
    public function Minitab(){
        $licenseData = Licenses::select('total', 'used', 'available')->first();

    // Assuming you want to return this data in JSON format
    return response()->json([
        'total' => $licenseData->total ?? 0,
        'used' => $licenseData->used ?? 0,
        'available' => $licenseData->available ?? 0,
    ]);
    }
}

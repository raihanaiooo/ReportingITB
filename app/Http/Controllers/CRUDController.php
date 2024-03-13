<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Licenses;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class CRUDController extends Controller
{
    public function updateApi(Request $request)
{
    try {
        $request->validate([
            'used' => 'required|integer',
        ]);

        // Find the license based on app_type_id equal to 3
        $license = Licenses::where('app_type_id', 3)->firstOrFail();

        // Calculate available as the difference between total and used
        $available = $license->total - $request->input('used');

        $license->update([
            'used' => $request->input('used'),
            'available' => $available,
            'inserted_at' => Carbon::now(), // Set inserted_at to the current time
        ]);

        Log::info('License updated successfully');

        return response()->json(['success' => 'License updated successfully'], 200);
    } catch (\Exception $e) {
        Log::error($e->getMessage());
        return response()->json(['error' => 'Internal Server Error'], 500);
    }
}
}
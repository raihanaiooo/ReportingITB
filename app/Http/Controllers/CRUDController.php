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
            $existingLicense = Licenses::where('app_type_id', 3)->first();
    
            if ($existingLicense) {
                // If the license already exists, update the existing license
                $available = $existingLicense->total - $request->input('used');
    
                $existingLicense->update([
                    'used' => $request->input('used'),
                    'available' => $available,
                    'inserted_at' => Carbon::now(), // Set inserted_at to the current time
                ]);
            } else {
                // If no existing license, create a new instance and save it
                $newLicense = new Licenses();
                $newLicense->app_type_id = 3;
                $newLicense->used = $request->input('used');
                $newLicense->available = $newLicense->total - $request->input('used'); // Assuming total is already in the database
                $newLicense->inserted_at = Carbon::now(); // Set inserted_at to the current time
                $newLicense->save();
            }
    
            Log::info('License updated successfully');
    
            return response()->json(['success' => 'License updated successfully'], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

}

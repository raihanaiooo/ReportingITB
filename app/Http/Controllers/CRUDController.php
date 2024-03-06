<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Licenses;
use Illuminate\Http\Request;

class CRUDController extends Controller
{
    public function updateApi(Request $request)
    {

        try{
            dd($request->all());
            $request->validate([
                'total' => 'required|integer',
                'used' => 'required|integer',
                'app_type_id' => 'required|exists:apps,id',
            ]);
        
            $license = Licenses::findOrFail($request->input('license_id'));
        
            // Hitung nilai available sebagai selisih antara total dan used
            $available = $request->input('total') - $request->input('used');
        
            $license->update([
                'total' => $request->input('total'),
                'used' => $request->input('used'),
                'available' => $available,
                'app_type_id' => $request->input('app_type_id'),
                'inserted_at' => Carbon::now(), // Set inserted_at ke waktu saat ini
            ]);

        }catch(\Exception $e){
            Log::error($e->getMessage());
        return response()->json(['error' => 'Internal Server Error'], 500);
        }
    
        // return response()->json(['message' => 'License updated successfully']);
    }

}

<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Licenses;
use Illuminate\Http\Request;

class CRUDController extends Controller
{
    public function updateApi(Request $request)
{
    $request->validate([
        'total' => 'required|integer',
        'used' => 'required|integer',
        'available' => 'required|integer',
        'app_type_id' => 'required|exists:apps,id',
    ]);

    $license = Licenses::findOrFail($request->input('license_id'));

    $license->update([
        'total' => $request->input('total'),
        'used' => $request->input('used'),
        'available' => $request->input('available'),
        'app_type_id' => $request->input('app_type_id'),
    ]);

    return response()->json(['message' => 'License updated successfully']);
}

}

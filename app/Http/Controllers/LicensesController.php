<?php

namespace App\Http\Controllers;
use App\Models\Licenses;
use Illuminate\Support\Carbon;
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

    public function MinitabBar(Request $request)
{
    $licenseData = Licenses::all();

    $result = [];

    $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    foreach ($months as $month) {
        $monthlyData = [
            'x' => $month,
            'y_used' => 0,
        ];

        // Loop melalui data dari tabel licenses
        foreach ($licenseData as $data) {
            // Gunakan Carbon untuk manipulasi waktu
            $insertedAt = Carbon::parse($data->inserted_at);

            // Filter data berdasarkan bulan
            if ($insertedAt->format('M') == $month) {

                $monthlyData['y_used'] += $data->used;
            }
        }


        $result[] = $monthlyData;
    }

    return response()->json(['result' => $result]);
}

}

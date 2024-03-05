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
    // Ambil data dari tabel licenses
    $licenseData = Licenses::all();

    // Inisialisasi hasil akhir
    $result = [];

    // Loop melalui setiap bulan
    $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    foreach ($months as $month) {
        // Inisialisasi data untuk setiap bulan
        $monthlyData = [
            'x' => $month,
            'y_total' => 0,
            'y_used' => 0,
            'y_available' => 0,
        ];

        // Loop melalui data dari tabel licenses
        foreach ($licenseData as $data) {
            // Gunakan Carbon untuk manipulasi waktu
            $insertedAt = Carbon::parse($data->inserted_at);

            // Filter data berdasarkan bulan
            if ($insertedAt->format('M') == $month) {
                $monthlyData['y_total'] += $data->total;
                $monthlyData['y_used'] += $data->used;
                $monthlyData['y_available'] += $data->available;
            }
        }

        // Tambahkan hasil akhir untuk setiap bulan
        $result[] = $monthlyData;
    }

    // Sekarang $result berisi data yang diinginkan
    // Anda dapat melanjutkan untuk memproses atau menyimpan data ini sesuai kebutuhan Anda

    return response()->json(['result' => $result]);
}
}

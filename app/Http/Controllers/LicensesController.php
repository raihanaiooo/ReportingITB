<?php

namespace App\Http\Controllers;
use App\Models\Licenses;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class LicensesController extends Controller
{
    public function Minitab()
    {
        $licenseData = Licenses::where('app_type_id', 5)
            ->select('total', 'used', 'available')
            ->first();
    
        return response()->json([
            'total' => $licenseData->total ?? 0,
            'used' => $licenseData->used ?? 0,
            'available' => $licenseData->available ?? 0,
        ]);
    }
    
    
    public function MinitabBar(Request $request)
    {
        $result = [];
        
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        foreach ($months as $month) {
            $monthlyUsed = Licenses::selectRaw('MAX(used) as used')
                ->whereMonth('inserted_at', Carbon::parse("1 $month")->month)
                ->where('app_type_id', 5)
                ->groupBy('app_type_id')
                ->pluck('used')
                ->first() ?? 0;
    
            $result[] = [
                'x' => $month,
                'y_used' => $monthlyUsed,
            ];
        }
    
        return response()->json(['result' => $result]);
    }
    
        
    public function Adobe()
    {
        $licenseData = Licenses::where('app_type_id', 3)
            ->select('total', 'used', 'available')
            ->first();
    
        return response()->json([
            'total' => $licenseData->total ?? 0,
            'used' => $licenseData->used ?? 0,
            'available' => $licenseData->available ?? 0,
        ]);
    }

    public function AdobeBar(Request $request)
    {
        $result = [];

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        foreach ($months as $month) {
            $monthlyUsed = Licenses::selectRaw('MAX(used) as used')
                ->whereMonth('inserted_at', Carbon::parse("1 $month")->month)
                ->where('app_type_id', 3)
                ->groupBy('app_type_id')
                ->pluck('used')
                ->first() ?? 0;

            $result[] = [
                'x' => $month,
                'y_used' => $monthlyUsed,
            ];
        }

        return response()->json(['result' => $result]);
    }


}

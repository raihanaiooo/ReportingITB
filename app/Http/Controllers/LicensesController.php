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
    public function Zoom()
    {
        $licenseData = Licenses::where('app_type_id', 1)
            ->select('total', 'used', 'available')
            ->first();
    
        return response()->json([
            'total' => $licenseData->total ?? 0,
            'used' => $licenseData->used ?? 0,
            'available' => $licenseData->available ?? 0,
        ]);
    }
       
    public function ZoomBar(Request $request)
    {
        $result = [];
        
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        foreach ($months as $month) {
            $monthlyUsed = Licenses::selectRaw('MAX(used) as used')
                ->whereMonth('inserted_at', Carbon::parse("1 $month")->month)
                ->where('app_type_id', 1)
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
    public function Mathlab()
    {
        $licenseData = Licenses::where('app_type_id', 4)
            ->select('total', 'used', 'available')
            ->first();
    
        return response()->json([
            'total' => $licenseData->total ?? 0,
            'used' => $licenseData->used ?? 0,
            'available' => $licenseData->available ?? 0,
        ]);
    }
       
    public function MathlabBar(Request $request)
    {
        $result = [];
        
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        foreach ($months as $month) {
            $monthlyUsed = Licenses::selectRaw('MAX(used) as used')
                ->whereMonth('inserted_at', Carbon::parse("1 $month")->month)
                ->where('app_type_id', 4)
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
    
    public function A3S()
    {
        $licenseData = Licenses::where('app_type_id', 2)
            ->select('total', 'used', 'available')
            ->first();
    
        return response()->json([
            'total' => $licenseData->total ?? 0,
            'used' => $licenseData->used ?? 0,
            'available' => $licenseData->available ?? 0,
        ]);
    }

    public function A3SBar(Request $request)
    {
        $result = [];

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        foreach ($months as $month) {
            $monthlyUsed = Licenses::selectRaw('MAX(used) as used')
            ->whereMonth('inserted_at', Carbon::parse("1 $month")->month)
            ->where('app_type_id', 2)
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

    public function A3SB()
    {
        $licenseData = Licenses::where('app_type_id', 6)
            ->select('total', 'used', 'available')
            ->first();
    
        return response()->json([
            'total' => $licenseData->total ?? 0,
            'used' => $licenseData->used ?? 0,
            'available' => $licenseData->available ?? 0,
        ]);
    }

    public function A3SBBar(Request $request)
    {
        $result = [];

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        foreach ($months as $month) {
            $monthlyUsed = Licenses::selectRaw('MAX(used) as used')
            ->whereMonth('inserted_at', Carbon::parse("1 $month")->month)
            ->where('app_type_id', 6)
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

    public function Visio()
    {
        $licenseData = Licenses::where('app_type_id', 7)
            ->select('total', 'used', 'available')
            ->first();
    
        return response()->json([
            'total' => $licenseData->total ?? 0,
            'used' => $licenseData->used ?? 0,
            'available' => $licenseData->available ?? 0,
        ]);
    }

    public function VisioBar(Request $request)
    {
        $result = [];

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        foreach ($months as $month) {
            $monthlyUsed = Licenses::selectRaw('MAX(used) as used')
            ->whereMonth('inserted_at', Carbon::parse("1 $month")->month)
            ->where('app_type_id', 7)
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

    public function Project()
    {
        $licenseData = Licenses::where('app_type_id', 8)
            ->select('total', 'used', 'available')
            ->first();
    
        return response()->json([
            'total' => $licenseData->total ?? 0,
            'used' => $licenseData->used ?? 0,
            'available' => $licenseData->available ?? 0,
        ]);
    }

    public function ProjectBar(Request $request)
    {
        $result = [];

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        foreach ($months as $month) {
            $monthlyUsed = Licenses::selectRaw('MAX(used) as used')
            ->whereMonth('inserted_at', Carbon::parse("1 $month")->month)
            ->where('app_type_id', 8)
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

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticketing;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use DateTime;



class TicketingController extends Controller
{

    public function Bar()
    {
        $allStatuses = [
            1 => 'Open',
            2 => 'Closed',
            3 => 'Resolved',
            4 => 'In Progress',
        ];
    
        $datas = Ticketing::all();
        $dataByMonth = [];
        $months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
    
        $labels = array_slice($months, 0, 12);
        $dataClosed = [];
        $dataResolved = [];
    
        foreach ($labels as $month) {
            $dataByMonth[$month] = [
                'label' => $month,
                'datasets' => [],
            ];
    
            foreach ($allStatuses as $statusKey => $statusName) {
                $dataByMonth[$month]['datasets'][$statusKey] = [
                    'label' => $statusName,
                    'backgroundColor' => "rgb(0, 224, 255)",
                    'borderColor' => "rgb(0, 224, 255)",
                    'borderWidth' => 1,
                    'data' => [],
                ];
            }
        }
    
        foreach ($datas as $item) {
            $statusKey = $item->status_id;
            $statusName = $allStatuses[$statusKey];
    
            $dateTime = DateTime::createFromFormat('M d, Y h:i A', $item->created_time);
    
            if ($dateTime) {
                $month = $dateTime->format('M');
                $dayOfMonth = $dateTime->format('j');
    
                // Accumulate the total for the specific day and status
                $dataByMonth[$month]['datasets'][$statusKey]['data'][$dayOfMonth] = $dataByMonth[$month]['datasets'][$statusKey]['data'][$dayOfMonth] ?? 0;
                $dataByMonth[$month]['datasets'][$statusKey]['data'][$dayOfMonth] += 1;
    
                // Accumulate the total for 'Closed' and 'Resolved'
                if ($statusName === 'Closed') {
                    $dataClosed[$month] = $dataClosed[$month] ?? 0;
                    $dataClosed[$month] += 1;
                } elseif ($statusName === 'Resolved') {
                    $dataResolved[$month] = $dataResolved[$month] ?? 0;
                    $dataResolved[$month] += 1;
                }
            } else {
                error_log("Failed to parse date: " . $item->created_time);
            }
        }
    
        // Sorting labels array
        usort($labels, function ($a, $b) use ($months) {
            return array_search($a, $months) - array_search($b, $months);
        });
    
        // Forming data arrays
        $result = [
            'series' => [
                [
                    'name' => 'Closed',
                    'color' => '#4154F1',
                    'data' => array_map(function ($label) use ($dataClosed) {
                        return [
                            'x' => $label,
                            'y' => $dataClosed[$label] ?? 0,
                        ];
                    }, $labels),
                ],
                [
                    'name' => 'Resolved',
                    'color' => '#DAE9FF',
                    'data' => array_map(function ($label) use ($dataResolved) {
                        return [
                            'x' => $label,
                            'y' => $dataResolved[$label] ?? 0,
                        ];
                    }, $labels),
                ],
            ],
        ];
    
        return response()->json($result);
    }
    

    public function Doughnut()
    {
        $allStatuses = [
            1 => 'Open',
            2 => 'Closed',
            3 => 'Resolved',
            4 => 'In Progress',
        ];
    
        $datas = Ticketing::all();
        $dataByDay = [];
        $months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
    
        // Initialize dataByDay for all days in the year
        foreach (range(1, 365) as $day) {
            $dataByDay[$day] = [
                'label' => $day,
                'datasets' => [],
            ];
            foreach ($allStatuses as $statusKey => $statusName) {
                $dataByDay[$day]['datasets'][$statusKey] = [
                    'label' => $statusName,
                    'backgroundColor' => "rgb(0, 224, 255)",
                    'borderColor' => "rgb(0, 224, 255)",
                    'borderWidth' => 1,
                    'data' => 0,
                ];
            }
        }
    
        foreach ($datas as $item) {
            $statusKey = $item->status_id;
            $statusName = $allStatuses[$statusKey];
    
            $dateTime = DateTime::createFromFormat('M d, Y h:i A', $item->created_time);
    
            if ($dateTime) {
                $day = $dateTime->format('z') + 1; // z returns the day of the year (0 through 365)
    
                // Check if the day is not Saturday (6) or Sunday (0)
                if ($dateTime->format('N') >= 1 && $dateTime->format('N') <= 5) {
                    // Accumulate the total for the specific day and status
                    $dataByDay[$day]['datasets'][$statusKey]['data'] += 1;
                }
            } else {
                error_log("Failed to parse date: " . $item->created_time);
            }
        }
    
        // Initialize the result array
        $result = [];
    
        foreach ($allStatuses as $statusKey => $statusName) {
            $statusData = [
                'name' => $statusName,
                'color' => $this->getStatusColor($statusKey),
                'data' => array_map(function ($dayData) use ($statusKey) {
                    return $dayData['datasets'][$statusKey]['data'];
                }, $dataByDay),
            ];
    
            $result[] = $statusData;
        }
    
        return response()->json($result);
    }
    
    private function getStatusColor($statusKey)
    {
        $colors = [
            1 => '#FDBA8C',
            4 => '#16BDCA',
            3 => '#4154F1',
            2 => '#E74694',
        ];
    
        return $colors[$statusKey] ?? '#000000'; // Default to black if color is not defined
    }
    
    
    

    
      
    


    

}    

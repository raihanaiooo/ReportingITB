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
        try {
            $allStatuses = [
                1 => 'Open',
                2 => 'Closed',
                3 => 'Resolved',
                4 => 'In Progress',
            ];
    
            $currentDayOfWeek = strval(date('M d, Y'));

            $datas = Ticketing::select('status_id')
                ->whereRaw("created_time LIKE CONCAT(?, '%')", [$currentDayOfWeek])
                ->get();
                $chartData = [
                    'labels' => ['Open', 'Closed', 'Resolved', 'In Progress'],
                'datasets' => [
                    [
                        'Open' => 0,
                        'Closed' => 0,
                        'Resolved' => 0,
                        'In Progress' => 0,
                    ],
                ],
                'day' => $currentDayOfWeek,
            ];
            
            return response()->json($datas);
            foreach ($datas as $data) {
                $statusName = $allStatuses[$data->status_id];
                $chartData['datasets'][0][$statusName]++;
            }
                
            return response()->json($chartData);
        } catch (\Exception $e) {
            \Log::error('Error in Doughnut endpoint: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
            
        }
    }              
                                  
}    

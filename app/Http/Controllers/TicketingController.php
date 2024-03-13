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
    
            $targetDate = 'Nov 29, 2023 09:46 AM';
    
            // Ubah tanggal menjadi format yang dapat diinterpretasi oleh DateTime
            $dateTime = DateTime::createFromFormat('M d, Y h:i A', $targetDate);
    
            // Validasi format tanggal
            if (!$dateTime) {
                throw new \Exception('Invalid date format');
            }
    
            $datas = Ticketing::select('*')
            ->select(DB::raw("CONVERT_TZ(created_time, 'your_current_timezone', 'UTC') AS created_time_utc"))
            ->having('created_time_utc', $dateTime->format('Y-m-d'))
            ->get();
                
            $chartData = [
                'labels' => array_values($allStatuses),
                'datasets' => [
                    [
                        'Mon' => [
                            'Open' => 0,
                            'Closed' => 0,
                            'Resolved' => 0,
                            'In Progress' => 0,
                        ],
                        'Tue' => [
                            'Open' => 0,
                            'Closed' => 0,
                            'Resolved' => 0,
                            'In Progress' => 0,
                        ],
                        'Wed' => [
                            'Open' => 0,
                            'Closed' => 0,
                            'Resolved' => 0,
                            'In Progress' => 0,
                        ],
                        'Thu' => [
                            'Open' => 0,
                            'Closed' => 0,
                            'Resolved' => 0,
                            'In Progress' => 0,
                        ],
                        'Fri' => [
                            'Open' => 0,
                            'Closed' => 0,
                            'Resolved' => 0,
                            'In Progress' => 0,
                        ],
                        'backgroundColor' => ['#FFCE56', '#4CAF50', '#FF5733', '#36A2EB'],
                    ],
                ],
                'day' => $dateTime->format('D'), // Format hari dari tanggal yang diberikan
            ];
    
            // Loop untuk setiap data
            foreach ($datas as $item) {
                $statusName = $allStatuses[$item->status_id];
                $dayOfWeek = $dateTime->format('D');
    
                // Increment count untuk status tertentu pada hari tertentu
                $chartData['datasets'][0][$dayOfWeek][$statusName]++;
            }
    
            return response()->json($chartData);
        } catch (\Exception $e) {
            \Log::error('Error in Doughnut endpoint: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error', 'message' => $e->getMessage()], 500);
        }
    }
            
}    

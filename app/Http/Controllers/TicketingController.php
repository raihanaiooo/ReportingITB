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
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
    
        $labels = $months;
        $dataClosed = [];
        $dataResolved = [];
    
        foreach ($months as $month) {
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
                $month = $dateTime->format('F');
                $dayOfMonth = $dateTime->format('j');
    
                // Initialize labels array
                if (!in_array($month, $labels)) {
                    $labels[] = $month;
                }
    
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
        $data = [];
        foreach ($labels as $label) {
            $total = 0;
    
            // Check if the month exists in the dataByMonth array
            if (isset($dataByMonth[$label])) {
                // Sum of 'Open' status for each month
                foreach ($allStatuses as $statusKey => $statusName) {
                    $total += array_sum($dataByMonth[$label]['datasets'][$statusKey]['data']);
                }
            }
    
            $data[] = $total;
        }
    
        // Separate data for 'Closed' and 'Resolved'
        $dataClosedFinal = array_values(array_map(function ($month) use ($dataClosed) {
            return $dataClosed[$month] ?? 0;
        }, $labels));
    
        $dataResolvedFinal = array_values(array_map(function ($month) use ($dataResolved) {
            return $dataResolved[$month] ?? 0;
        }, $labels));
    
        $result = [
            'labels' => $labels,
            'dataClosed' => $dataClosedFinal,
            'dataResolved' => $dataResolvedFinal,
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

         $datas = Ticketing::getStatusData();

        $labels = [];
        $data = [];
        $backgroundColor = [];

        $statusColors = [
            'Open' => 'rgb(0, 224, 255)', 
            'Closed' => 'rgb(65, 84, 241)',
            'Resolved' => 'rgb(203, 233, 246)', 
            'In Progress' => 'rgb(65, 195, 251)',
        ];

        foreach ($datas as $item) {
            $statusName = $allStatuses[$item->status_id];
        
            $labels[] = $statusName;
            $data[] = $item->total;
            $backgroundColor[] = $statusColors[$statusName];
        }

        // JSON response for doughnut chart
        $result = [
            'labels' => $labels,
            'datasets' => [
                [
                    'data' => $data,
                    'backgroundColor' => $backgroundColor,
                    'borderColor' => 'rgba(255, 255, 255, 0.8)', // Border color for the doughnut segments
                    'borderWidth' => 1,
                ],
            ],
        ];

        return response()->json($result);
    }
}

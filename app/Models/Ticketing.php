<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Ticketing extends Model
{
    use HasFactory;
    protected $table = 'ticketing';

    protected $fillable = [
       'id_scrape', 'createdDate', 'dueDate', 'status_id','created_at', 'updated_at'
    ];


    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id'); // 'status_id' should match your actual foreign key in the 'ticketing' table.
    }

    public static function getStatusData()
    {
        return self::select('status_id', DB::raw('COUNT(*) AS total'))
            ->groupBy('status_id')
            ->get();
    }

}

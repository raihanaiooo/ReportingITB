<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Licenses extends Model
{
    use HasFactory;
    protected $table = 'licenses';

    protected $fillable = [
       'total','used','available','app_type_id','inserted_at','created_at', 'updated_at'
    ];
    public function app()
    {
        return $this->belongsTo(App::class, 'app_type_id'); // 'status_id' should match your actual foreign key in the 'ticketing' table.
    }
}

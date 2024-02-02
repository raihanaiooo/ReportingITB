<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticketing extends Model
{
    use HasFactory;
    protected $table = 'ticketing';

    protected $fillable = [
       'id_scrape', 'createdDate', 'dueDate', 'status_id'
    ];
    // public function setStatusAttribute($value)
    // {
    //     $this->attributes['status'] = (int) $value;
    // }
    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id'); // 'status_id' should match your actual foreign key in the 'ticketing' table.
    }

}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticketing extends Model
{
    use HasFactory;
    protected $table = 'ticketing';

    protected $fillable = [
       'assign', 'createdDate', 'dueDate', 'status', 'site', 'priority', 'group'
    ];

}

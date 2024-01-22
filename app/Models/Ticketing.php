<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticketing extends Model
{
    use HasFactory;
    protected $table = 'ticketing';

    protected $fillable = [
       'name', 'email', 'password', 'phone', 'mobile', 'licenses', 'web_type', 'department', 'role'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class App extends Model
{
    use HasFactory;
    protected $table = 'app';

    protected $fillable = [
       'name'
    ];

    public function licenses()
    {
        return $this->hasMany(Licenses::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ATM extends Model
{
    protected $table = 'atms';

    protected $fillable = ['name', 'latitude', 'longitude', 'address', 'services', 'available_24h'];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'services' => 'array',
            'available_24h' => 'boolean',
        ];
    }
}

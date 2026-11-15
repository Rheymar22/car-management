<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleMaintenanceLog extends Model
{
    public const TYPES = ['pms', 'oil_change', 'tires', 'brakes', 'battery', 'repair', 'other'];

    protected $fillable = [
        'vehicle_id',
        'type',
        'performed_at',
        'odometer_km',
        'cost',
        'next_due_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'performed_at' => 'date',
        'next_due_at'  => 'date',
        'cost'         => 'decimal:2',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'booking_ref',
        'user_id',
        'vehicle_id',
        'customer_id',
        'status',
        'pickup_datetime',
        'dropoff_datetime',
        'actual_return_datetime',
        'pickup_location',
        'dropoff_location',
        'custom_pickup_address',
        'custom_dropoff_address',
        'base_amount',
        'discount_amount',
        'late_penalty',
        'total_amount',
        'rental_terms_accepted',
        'rental_terms_accepted_at',
        'notes',
    ];

    protected $casts = [
        'pickup_datetime'          => 'datetime',
        'dropoff_datetime'         => 'datetime',
        'actual_return_datetime'   => 'datetime',
        'rental_terms_accepted'    => 'boolean',
        'rental_terms_accepted_at' => 'datetime',
        'base_amount'              => 'decimal:2',
        'discount_amount'          => 'decimal:2',
        'late_penalty'             => 'decimal:2',
        'total_amount'             => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function customer()
    {
        return $this->belongsTo(CustomerProfile::class, 'customer_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}

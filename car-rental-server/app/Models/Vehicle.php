<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Vehicle extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'plate_number',
        'make',
        'model',
        'year',
        'color',
        'type',
        'current_mileage',
        'daily_rate',
        'hourly_rate',
        'weekly_rate',
        'status',
        'condition_notes',
        'last_maintenance_date',
        'next_maintenance_date',
        'image_path',
        'features',
    ];

    protected $casts = [
        'features'              => 'array',
        'last_maintenance_date' => 'date',
        'next_maintenance_date' => 'date',
        'daily_rate'            => 'decimal:2',
        'hourly_rate'           => 'decimal:2',
        'weekly_rate'           => 'decimal:2',
    ];

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', 'available');
    }

    public function scopeAvailableBetween(Builder $query, Carbon $start, Carbon $end): Builder
    {
        return $query->where('status', '!=', 'maintenance')
            ->where('status', '!=', 'retired')
            ->whereDoesntHave('bookings', function (Builder $q) use ($start, $end) {
                $q->whereIn('status', ['confirmed', 'active'])
                  ->where(function ($inner) use ($start, $end) {
                      $inner->whereBetween('pickup_datetime', [$start, $end])
                            ->orWhereBetween('dropoff_datetime', [$start, $end])
                            ->orWhere(function ($wrap) use ($start, $end) {
                                $wrap->where('pickup_datetime', '<=', $start)
                                     ->where('dropoff_datetime', '>=', $end);
                            });
                  });
            });
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function activeBooking()
    {
        return $this->hasOne(Booking::class)->where('status', 'active');
    }
}

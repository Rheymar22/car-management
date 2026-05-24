<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'booking_id',
        'paymongo_payment_id',
        'paymongo_intent_id',
        'method',
        'status',
        'amount',
        'gateway_fee',
        'net_amount',
        'currency',
        'failure_reason',
        'gateway_response',
        'paid_at',
    ];

    protected $casts = [
        'amount'           => 'decimal:2',
        'gateway_fee'      => 'decimal:2',
        'net_amount'       => 'decimal:2',
        'gateway_response' => 'array',
        'paid_at'          => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}

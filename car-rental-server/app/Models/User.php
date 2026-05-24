<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'terms_accepted',
        'terms_accepted_at',
        'terms_ip',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'terms_accepted'    => 'boolean',
            'terms_accepted_at' => 'datetime',
        ];
    }

    public function customerProfile()
    {
        return $this->hasOne(CustomerProfile::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}

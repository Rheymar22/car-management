<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class CustomerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'middle_name',
        'date_of_birth',
        'sex',
        'phone',
        'address',
        'city',
        'province',
        'license_number_encrypted',
        'license_expiry_encrypted',
        'license_restriction_code',
        'license_front_path',
        'license_back_path',
        'emergency_contact_name',
        'emergency_contact_phone',
        'reliability_score',
        'total_rentals',
        'late_returns',
        'damage_incidents',
        'no_shows',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    // Encrypt license number before saving
    public function setLicenseNumberAttribute(string $value): void
    {
        $this->attributes['license_number_encrypted'] = Crypt::encryptString($value);
    }

    // Decrypt license number when accessing
    public function getLicenseNumberAttribute(): ?string
    {
        if (empty($this->attributes['license_number_encrypted'])) return null;
        return Crypt::decryptString($this->attributes['license_number_encrypted']);
    }

    // Encrypt license expiry before saving
    public function setLicenseExpiryAttribute(string $value): void
    {
        $this->attributes['license_expiry_encrypted'] = Crypt::encryptString($value);
    }

    // Decrypt license expiry when accessing
    public function getLicenseExpiryAttribute(): ?string
    {
        if (empty($this->attributes['license_expiry_encrypted'])) return null;
        return Crypt::decryptString($this->attributes['license_expiry_encrypted']);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}

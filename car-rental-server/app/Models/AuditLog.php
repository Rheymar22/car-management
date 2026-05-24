<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'metadata'   => 'array',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            $model->created_at = now();
        });
    }

    public static function record(
        string $event,
        ?int $userId,
        Request $request,
        array $meta = []
    ): void {
        static::create([
            'event'      => $event,
            'user_id'    => $userId,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent() ?? 'Unknown',
            'email'      => $meta['email'] ?? null,
            'metadata'   => json_encode($meta),
        ]);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

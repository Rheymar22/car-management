<?php

namespace App\Jobs;

use App\Models\CustomerProfile;
use App\Services\CreditScoringService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecalculateCreditScoreJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly ?int $customerId) {}

    public function handle(CreditScoringService $service): void
    {
        if (!$this->customerId) return;

        $profile = CustomerProfile::find($this->customerId);
        if ($profile) {
            $service->recalculate($profile);
        }
    }
}

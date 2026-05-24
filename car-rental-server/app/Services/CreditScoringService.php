<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\CustomerProfile;

class CreditScoringService
{
    private const BASE_SCORE      = 200;
    private const LATE_RETURN     = -15;
    private const DAMAGE_INCIDENT = -30;
    private const NO_SHOW         = -25;
    private const PROMPT_PAYMENT  = +5;
    private const MAX_BONUS       = 30;

    public function recalculate(CustomerProfile $customer): void
    {
        $bookings = Booking::where('user_id', $customer->user_id)
            ->whereIn('status', ['completed', 'no_show', 'cancelled'])
            ->with('payments')
            ->get();

        $score           = self::BASE_SCORE;
        $lateReturns     = 0;
        $damageIncidents = 0;
        $noShows         = 0;
        $promptPayments  = 0;

        foreach ($bookings as $booking) {
            if ($booking->status === 'completed' && $booking->actual_return_datetime) {
                $minutesLate = $booking->dropoff_datetime
                    ->diffInMinutes($booking->actual_return_datetime);
                if ($minutesLate > 30) $lateReturns++;
            }

            if ($booking->late_penalty > 1000) $damageIncidents++;
            if ($booking->status === 'no_show') $noShows++;

            $firstPayment = $booking->payments->where('status', 'paid')->first();
            if ($firstPayment && $firstPayment->paid_at?->diffInHours($booking->created_at) <= 24) {
                $promptPayments++;
            }
        }

        $bonus  = min($promptPayments * self::PROMPT_PAYMENT, self::MAX_BONUS);
        $score += $bonus;
        $score += $lateReturns * self::LATE_RETURN;
        $score += $damageIncidents * self::DAMAGE_INCIDENT;
        $score += $noShows * self::NO_SHOW;
        $score  = max(0, min(200, $score));

        $customer->update([
            'reliability_score' => $score,
            'total_rentals'     => $bookings->where('status', 'completed')->count(),
            'late_returns'      => $lateReturns,
            'damage_incidents'  => $damageIncidents,
            'no_shows'          => $noShows,
        ]);
    }

    public function getDepositMultiplier(CustomerProfile $customer): float
    {
        return match (true) {
            $customer->reliability_score >= 150 => 1.0,
            $customer->reliability_score >= 100 => 1.5,
            $customer->reliability_score >= 50  => 2.0,
            default                             => 3.0,
        };
    }

    public function getRiskLabel(CustomerProfile $customer): string
    {
        return match (true) {
            $customer->reliability_score >= 150 => 'Trusted',
            $customer->reliability_score >= 100 => 'Standard',
            $customer->reliability_score >= 50  => 'At Risk',
            default                             => 'High Risk',
        };
    }
}

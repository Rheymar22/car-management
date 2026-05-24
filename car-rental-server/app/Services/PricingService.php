<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Vehicle;
use Carbon\Carbon;

class PricingService
{
    public function calculate(Vehicle $vehicle, Carbon $start, Carbon $end): array
    {
        $hours = max(1, $start->diffInHours($end));
        $days  = $start->diffInDays($end);
        $weeks = (int) floor($days / 7);

        if ($weeks >= 1 && $vehicle->weekly_rate) {
            $remainingDays = $days % 7;
            $base = ($weeks * $vehicle->weekly_rate) + ($remainingDays * $vehicle->daily_rate);
        } elseif ($days >= 1) {
            $extraHours = $hours % 24;
            $base = $days * $vehicle->daily_rate;
            if ($extraHours > 0) {
                $base += $vehicle->daily_rate;
            }
        } else {
            $rate = $vehicle->hourly_rate ?? ($vehicle->daily_rate / 8);
            $base = $hours * $rate;
        }

        $discount = $this->getDiscount($vehicle, $days, $base);

        return [
            'base'     => round($base, 2),
            'discount' => round($discount, 2),
            'total'    => round(max(0, $base - $discount), 2),
            'hours'    => $hours,
            'days'     => $days,
        ];
    }

    private function getDiscount(Vehicle $vehicle, int $days, float $base): float
    {
        if ($days >= 7)  return $base * 0.10;
        if ($days >= 3)  return $base * 0.05;
        return 0;
    }

    public function calculateLatePenalty(Booking $booking): float
    {
        if (!$booking->actual_return_datetime) return 0;
        $minutesLate = $booking->dropoff_datetime->diffInMinutes($booking->actual_return_datetime);
        if ($minutesLate <= 30) return 0;
        $hoursLate = (int) ceil(($minutesLate - 30) / 60);
        return $hoursLate * 500.00;
    }
}

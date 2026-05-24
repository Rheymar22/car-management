<?php

namespace App\Services;

use App\Exceptions\BookingConflictException;
use App\Exceptions\VehicleUnavailableException;
use App\Models\Booking;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BookingConflictService
{
    public function hasConflict(int $vehicleId, Carbon $start, Carbon $end, ?int $excludeId = null): bool
    {
        return Booking::where('vehicle_id', $vehicleId)
            ->whereIn('status', ['confirmed', 'active'])
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('pickup_datetime', [$start, $end])
                  ->orWhereBetween('dropoff_datetime', [$start, $end])
                  ->orWhere(function ($w) use ($start, $end) {
                      $w->where('pickup_datetime', '<=', $start)
                        ->where('dropoff_datetime', '>=', $end);
                  });
            })->exists();
    }

    public function createBooking(array $data, User $user): Booking
    {
        $start     = Carbon::parse($data['pickup_datetime']);
        $end       = Carbon::parse($data['dropoff_datetime']);
        $vehicleId = $data['vehicle_id'];

        return DB::transaction(function () use ($data, $user, $start, $end, $vehicleId) {

            $vehicle = Vehicle::lockForUpdate()->findOrFail($vehicleId);

            if (in_array($vehicle->status, ['maintenance', 'retired'])) {
                throw new VehicleUnavailableException('This vehicle is not available for rental.');
            }

            if ($this->hasConflict($vehicleId, $start, $end)) {
                throw new BookingConflictException('This vehicle is already booked for the selected dates. Please choose different dates.');
            }

            $pricing = app(PricingService::class)->calculate($vehicle, $start, $end);

            $booking = Booking::create([
                'booking_ref'              => $this->generateRef(),
                'user_id'                  => $user->id,
                'vehicle_id'               => $vehicleId,
                'customer_id'              => $user->customerProfile?->id,
                'status'                   => 'confirmed',
                'pickup_datetime'          => $start,
                'dropoff_datetime'         => $end,
                'pickup_location'          => $data['pickup_location'],
                'dropoff_location'         => $data['dropoff_location'],
                'custom_pickup_address'    => $data['custom_pickup_address'] ?? null,
                'custom_dropoff_address'   => $data['custom_dropoff_address'] ?? null,
                'base_amount'              => $pricing['base'],
                'discount_amount'          => $pricing['discount'],
                'total_amount'             => $pricing['total'],
                'rental_terms_accepted'    => true,
                'rental_terms_accepted_at' => now(),
                'notes'                    => $data['notes'] ?? null,
            ]);

            $vehicle->update(['status' => 'rented']);

            return $booking;
        });
    }

    private function generateRef(): string
    {
        $last = Booking::max('id') ?? 0;
        return 'RCR-' . date('Y') . '-' . str_pad($last + 1, 5, '0', STR_PAD_LEFT);
    }
}

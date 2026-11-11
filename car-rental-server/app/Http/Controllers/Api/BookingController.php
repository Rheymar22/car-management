<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BookingConflictException;
use App\Exceptions\VehicleUnavailableException;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateBookingRequest;
use App\Jobs\RecalculateCreditScoreJob;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Services\BookingConflictService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::where('user_id', $request->user()->id)
            ->with('vehicle:id,make,model,plate_number,image_path')
            ->latest()
            ->paginate(10);
        return response()->json($bookings);
    }

    public function adminIndex(): JsonResponse
    {
        $bookings = Booking::with([
            'user:id,name,email',
            'vehicle:id,make,model,plate_number'
        ])->latest()->paginate(50);
        return response()->json($bookings);
    }

    public function store(CreateBookingRequest $request, BookingConflictService $service): JsonResponse
    {
        try {
            $booking = $service->createBooking($request->validated(), $request->user());
        } catch (BookingConflictException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        } catch (VehicleUnavailableException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message'     => 'Booking submitted and awaiting confirmation.',
            'booking'     => $booking->load('vehicle'),
            'booking_ref' => $booking->booking_ref,
        ], 201);
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        if ($request->user()->role !== 'admin' && $booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        return response()->json(['booking' => $booking->load(['vehicle', 'payments'])]);
    }

    public function confirm(Request $request, Booking $booking): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($booking->status !== 'pending') {
            return response()->json(['message' => 'Only pending bookings can be confirmed.'], 422);
        }

        $booking->update(['status' => 'confirmed']);

        AuditLog::record(
            event: 'booking_confirmed',
            userId: $request->user()->id,
            request: $request,
            meta: [
                'booking_id'  => $booking->id,
                'booking_ref' => $booking->booking_ref,
            ]
        );

        return response()->json([
            'message' => 'Booking confirmed. The customer can now proceed to payment.',
            'booking' => $booking->refresh(),
        ]);
    }

    public function complete(Request $request, Booking $booking): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($booking->status !== 'active') {
            return response()->json(['message' => 'Only active bookings can be marked as completed.'], 422);
        }

        $request->validate([
            'has_damage'   => ['sometimes', 'boolean'],
            'damage_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $actualReturn = now();
        $isLateReturn = $actualReturn->greaterThan($booking->dropoff_datetime);
        $hasDamage = $request->boolean('has_damage');

        $booking->update([
            'status'                 => 'completed',
            'actual_return_datetime' => $actualReturn,
            'has_damage'             => $hasDamage,
            'damage_notes'           => $hasDamage ? $request->input('damage_notes') : null,
        ]);
        $booking->vehicle->update(['status' => 'available']);

        $customer = $booking->customer;

        if ($customer) {
            $customer->total_rentals += 1;

            if ($isLateReturn) {
                $customer->late_returns += 1;
            }

            if ($hasDamage) {
                $customer->damage_incidents += 1;
            }

            $customer->save();

            dispatch(new RecalculateCreditScoreJob($booking->customer_id));
        }

        AuditLog::record(
            event: 'booking_completed',
            userId: $request->user()->id,
            request: $request,
            meta: [
                'booking_id'      => $booking->id,
                'booking_ref'     => $booking->booking_ref,
                'late_return'     => $isLateReturn,
                'has_damage'      => $hasDamage,
                'damage_notes'    => $request->input('damage_notes'),
                'scheduled_dropoff' => $booking->dropoff_datetime,
                'actual_return'   => $actualReturn,
            ]
        );

        $message = 'Booking marked as completed.';
        if ($isLateReturn && $hasDamage) {
            $message = 'Booking completed. Late return and vehicle damage were recorded — this will affect the customer\'s reliability score.';
        } elseif ($isLateReturn) {
            $message = 'Booking completed. This was a late return and has been recorded.';
        } elseif ($hasDamage) {
            $message = 'Booking completed. Vehicle damage was recorded.';
        }

        return response()->json([
            'message' => $message,
            'booking' => $booking->refresh(),
        ]);
    }

    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        if ($request->user()->role !== 'admin' && $booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (in_array($booking->status, ['cancelled', 'completed', 'no_show'])) {
            return response()->json(['message' => 'This booking cannot be cancelled.'], 422);
        }

        $wasActive = $booking->status === 'active';
        $hoursUntilPickup = now()->diffInHours($booking->pickup_datetime, false);
        $isLateCancellation = !$wasActive && $hoursUntilPickup < 24;

        $hasPaidPayment = $booking->payments()->where('status', 'paid')->exists();

        $previousStatus = $booking->status;

        $isNoShow = $wasActive || $isLateCancellation;
        $newStatus = $isNoShow ? 'no_show' : 'cancelled';

        $booking->update(['status' => $newStatus]);
        $booking->vehicle->update(['status' => 'available']);

        if ($isNoShow && $booking->customer) {
            $booking->customer->increment('no_shows');
            dispatch(new RecalculateCreditScoreJob($booking->customer_id));
        }

        AuditLog::record(
            event: 'booking_cancelled',
            userId: $request->user()->id,
            request: $request,
            meta: [
                'booking_id'         => $booking->id,
                'booking_ref'        => $booking->booking_ref,
                'previous_status'    => $previousStatus,
                'was_active'         => $wasActive,
                'late_cancellation'  => $isLateCancellation,
                'hours_until_pickup' => round($hoursUntilPickup, 1),
                'refund_required'    => $hasPaidPayment,
            ]
        );

        $message = 'Booking cancelled.';
        if ($wasActive) {
            $message = $hasPaidPayment
                ? 'Booking cancelled. This rental was already active and paid — a manual refund may be required, please contact support.'
                : 'Booking cancelled. This rental was already active.';
        } elseif ($isLateCancellation) {
            $message = 'Booking cancelled. Because this was cancelled less than 24 hours before pickup, it was recorded and may affect your reliability score.';
        }

        return response()->json([
            'message' => $message,
            'booking' => $booking->refresh(),
        ]);
    }
}

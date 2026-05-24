<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BookingConflictException;
use App\Exceptions\VehicleUnavailableException;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateBookingRequest;
use App\Jobs\RecalculateCreditScoreJob;
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
            'message'     => 'Booking confirmed.',
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

    public function complete(Request $request, Booking $booking): JsonResponse
    {
        $booking->update([
            'status'                 => 'completed',
            'actual_return_datetime' => now(),
        ]);
        $booking->vehicle->update(['status' => 'available']);
        dispatch(new RecalculateCreditScoreJob($booking->customer_id));
        return response()->json(['booking' => $booking->refresh()]);
    }

    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->status === 'active') {
            return response()->json(['message' => 'Cannot cancel an active rental.'], 422);
        }
        $booking->update(['status' => 'cancelled']);
        $booking->vehicle->update(['status' => 'available']);
        return response()->json(['message' => 'Booking cancelled.']);
    }
}

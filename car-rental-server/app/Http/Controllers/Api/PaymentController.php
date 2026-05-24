<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\PayMongoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function simulate(Request $request): JsonResponse
    {
        $request->validate(['booking_id' => ['required', 'exists:bookings,id']]);

        $booking = Booking::findOrFail($request->booking_id);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking->payments()->create([
            'amount'         => $booking->total_amount,
            'method'         => $request->input('method', 'simulated'),
            'status'         => 'paid',
            'transaction_id' => 'SIM-' . strtoupper(uniqid()),
            'paid_at'        => now(),
        ]);

        $booking->update(['status' => 'confirmed']);

        return response()->json(['message' => 'Payment simulated successfully.']);
    }

    public function createIntent(Request $request, PayMongoService $paymongo): JsonResponse
    {
        $request->validate(['booking_id' => ['required', 'exists:bookings,id']]);
        $booking = Booking::findOrFail($request->booking_id);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $intent = $paymongo->createPaymentIntent($booking);
        return response()->json([
            'client_key' => $intent['attributes']['client_key'],
            'intent_id'  => $intent['id'],
        ]);
    }

    public function createSource(Request $request, PayMongoService $paymongo): JsonResponse
    {
        $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
            'type'       => ['required', 'in:gcash,paymaya'],
        ]);

        $booking = Booking::findOrFail($request->booking_id);
        $source  = $paymongo->createSource($booking, $request->type);

        return response()->json([
            'checkout_url' => $source['attributes']['redirect']['checkout_url'],
            'source_id'    => $source['id'],
        ]);
    }

    public function financialReport(): JsonResponse
    {
        $data = \App\Models\Payment::where('status', 'paid')
            ->selectRaw('DATE(paid_at) as date, SUM(amount) as total, SUM(gateway_fee) as fees, COUNT(*) as count')
            ->groupBy('date')
            ->orderByDesc('date')
            ->get();
        return response()->json(['report' => $data]);
    }
}

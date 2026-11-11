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
        $request->validate([
            'booking_id'   => ['required', 'exists:bookings,id'],
            'payment_type' => ['required', 'in:full,down_payment'],
        ]);

        $booking = Booking::findOrFail($request->booking_id);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($booking->status !== 'confirmed') {
            return response()->json(['message' => 'This booking is not awaiting payment.'], 422);
        }

        $amount = $request->payment_type === 'down_payment'
            ? round($booking->total_amount * 0.5, 2)
            : (float) $booking->total_amount;

        $booking->payments()->create([
            'paymongo_payment_id' => 'SIM-' . strtoupper(uniqid()),
            'method'              => $request->input('method', 'simulated'),
            'status'              => 'paid',
            'amount'              => $amount,
            'gateway_fee'         => 0,
            'net_amount'          => $amount,
            'currency'            => 'PHP',
            'payment_type'        => $request->payment_type,
            'paid_at'             => now(),
        ]);

        $booking->update(['status' => 'active']);

        $balance = round($booking->total_amount - $amount, 2);

        return response()->json([
            'message' => $request->payment_type === 'down_payment'
                ? 'Down payment of ₱' . number_format($amount, 2) . ' received. Remaining balance of ₱' . number_format($balance, 2) . ' is due at pickup/return.'
                : 'Full payment received.',
            'amount_paid' => $amount,
            'balance_due' => $balance,
        ]);
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

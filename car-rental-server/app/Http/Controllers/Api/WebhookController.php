<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function paymongo(Request $request): JsonResponse
    {
        $signature = $request->header('Paymongo-Signature');
        $payload   = $request->getContent();

        if (!$this->verifySignature($payload, $signature)) {
            return response()->json(['error' => 'Invalid signature.'], 401);
        }

        $type  = $request->json('data.attributes.type');
        $event = $request->json('data.attributes.data');

        match ($type) {
            'payment.paid'   => $this->handlePaid($event),
            'payment.failed' => $this->handleFailed($event),
            default          => null,
        };

        return response()->json(['received' => true]);
    }

    private function handlePaid(array $data): void
    {
        $bookingId = $data['attributes']['metadata']['booking_id'] ?? null;
        if (!$bookingId) return;

        DB::transaction(function () use ($data, $bookingId) {
            $booking = Booking::find($bookingId);
            if (!$booking) return;
            $amount = $data['attributes']['amount'] / 100;

            Payment::updateOrCreate(
                ['paymongo_payment_id' => $data['id']],
                [
                    'booking_id'       => $booking->id,
                    'method'           => $data['attributes']['source']['type'] ?? 'card',
                    'status'           => 'paid',
                    'amount'           => $amount,
                    'gateway_fee'      => round($amount * 0.015, 2),
                    'net_amount'       => round($amount * 0.985, 2),
                    'gateway_response' => $data,
                    'paid_at'          => now(),
                ]
            );
            $booking->update(['status' => 'confirmed']);
        });
    }

    private function handleFailed(array $data): void
    {
        $bookingId = $data['attributes']['metadata']['booking_id'] ?? null;
        if (!$bookingId) return;

        Payment::updateOrCreate(
            ['paymongo_payment_id' => $data['id']],
            [
                'booking_id'     => $bookingId,
                'status'         => 'failed',
                'failure_reason' => $data['attributes']['last_payment_error']['failed_message'] ?? 'Payment failed.',
                'amount'         => $data['attributes']['amount'] / 100,
                'gateway_fee'    => 0,
                'net_amount'     => 0,
                'method'         => 'card',
            ]
        );
    }

    private function verifySignature(string $payload, ?string $header): bool
    {
        if (!$header) return false;

        // FIXED: Explicitly pull and validate the webhook secret type to satisfy IDE linters
        $secret = config('services.paymongo.webhook_secret');
        if (!is_string($secret) || empty($secret)) {
            Log::error('PayMongo webhook secret is missing or not a valid string in config.');
            return false;
        }

        $parts = [];
        foreach (explode(',', $header) as $part) {
            [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
            $parts[$k] = $v;
        }

        $t    = $parts['t'] ?? '';
        $hmac = hash_hmac('sha256', "{$t}.{$payload}", $secret);

        return hash_equals($hmac, $parts['te'] ?? '');
    }
}

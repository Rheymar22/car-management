<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class PayMongoService
{
    private string $baseUrl = 'https://api.paymongo.com/v1';

    private function client(): PendingRequest
    {
        return Http::withBasicAuth(config('services.paymongo.secret_key'), '')
            ->acceptJson()
            ->contentType('application/json');
    }

    public function createPaymentIntent(Booking $booking): array
    {
        $response = $this->client()->post("{$this->baseUrl}/payment_intents", [
            'data' => [
                'attributes' => [
                    'amount'                => (int) ($booking->total_amount * 100),
                    'payment_method_allowed'=> ['card', 'gcash', 'paymaya'],
                    'payment_method_options'=> ['card' => ['request_three_d_secure' => 'any']],
                    'currency'              => 'PHP',
                    'description'           => "Booking {$booking->booking_ref} - Roxas City Car Rental",
                    'metadata'              => [
                        'booking_id'  => $booking->id,
                        'booking_ref' => $booking->booking_ref,
                    ],
                ],
            ],
        ]);
        return $response->throw()->json('data');
    }

    public function createSource(Booking $booking, string $type): array
    {
        $response = $this->client()->post("{$this->baseUrl}/sources", [
            'data' => [
                'attributes' => [
                    'amount'   => (int) ($booking->total_amount * 100),
                    'currency' => 'PHP',
                    'type'     => $type,
                    'redirect' => [
                        'success' => config('app.url') . "/payment/success?ref={$booking->booking_ref}",
                        'failed'  => config('app.url') . "/payment/failed?ref={$booking->booking_ref}",
                    ],
                    'billing'  => [
                        'name'  => $booking->user->name,
                        'email' => $booking->user->email,
                        'phone' => $booking->user->customerProfile?->phone ?? '',
                    ],
                    'metadata' => [
                        'booking_id'  => $booking->id,
                        'booking_ref' => $booking->booking_ref,
                    ],
                ],
            ],
        ]);
        return $response->throw()->json('data');
    }
}

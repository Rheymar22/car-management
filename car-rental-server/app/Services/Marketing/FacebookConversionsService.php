<?php

namespace App\Services\Marketing;

use App\Models\Booking;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookConversionsService
{
    private string $pixelId;
    private string $accessToken;
    private string $apiVersion = 'v19.0';

    public function __construct()
    {
        $this->pixelId     = config('services.facebook.pixel_id', '');
        $this->accessToken = config('services.facebook.access_token', '');
    }

    public function trackBookingConversion(Booking $booking): void
    {
        if (empty($this->pixelId)) return;

        $this->sendEvent([
            'event_name'    => 'Purchase',
            'event_time'    => now()->timestamp,
            'action_source' => 'website',
            'user_data'     => [
                'em' => hash('sha256', strtolower($booking->user->email)),
                'ph' => hash('sha256', $booking->user->customerProfile?->phone ?? ''),
            ],
            'custom_data'   => [
                'value'    => (float) $booking->total_amount,
                'currency' => 'PHP',
                'contents' => [[
                    'id'    => (string) $booking->vehicle_id,
                    'title' => "{$booking->vehicle->make} {$booking->vehicle->model}",
                ]],
            ],
        ]);
    }

    public function trackVehicleAvailability(Vehicle $vehicle): void
    {
        if (empty($this->pixelId)) return;

        $this->sendEvent([
            'event_name'    => 'ViewContent',
            'event_time'    => now()->timestamp,
            'action_source' => 'system_generated',
            'custom_data'   => [
                'content_name' => "{$vehicle->make} {$vehicle->model}",
                'content_type' => 'vehicle',
                'value'        => (float) $vehicle->daily_rate,
                'currency'     => 'PHP',
            ],
        ]);
    }

    private function sendEvent(array $eventData): void
    {
        try {
            Http::withToken($this->accessToken)
                ->post("https://graph.facebook.com/{$this->apiVersion}/{$this->pixelId}/events", [
                    'data' => [$eventData],
                ]);
        } catch (\Throwable $e) {
            Log::error('Facebook Conversions API error: ' . $e->getMessage());
        }
    }
}

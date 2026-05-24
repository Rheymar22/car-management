<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id'             => ['required', 'exists:vehicles,id'],
            'pickup_datetime'        => ['required', 'date', 'after:' . now()->subMinutes(10)],
            'dropoff_datetime'       => ['required', 'date', 'after:pickup_datetime'],
            'pickup_location'        => ['required', 'string', 'max:255'],
            'dropoff_location'       => ['required', 'string', 'max:255'],
            'custom_pickup_address'  => ['nullable', 'string', 'max:500'],
            'custom_dropoff_address' => ['nullable', 'string', 'max:500'],
            'rental_terms_accepted'  => ['required', 'accepted'],
            'notes'                  => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'pickup_datetime.after'          => 'The pickup date must be a future date.',
            'rental_terms_accepted.accepted' => 'You must accept the Rental Agreement Terms and Conditions.',
        ];
    }
}

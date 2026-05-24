<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function download(Request $request, Booking $booking)
    {
        if ($request->user()->role !== 'admin' && $booking->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized.');
        }

        $booking->load(['vehicle', 'user', 'payments']);

        $pdf = Pdf::loadView('invoices.rental', [
            'booking' => $booking,
            'company' => [
                'name'    => 'Roxas City Car Rental',
                'address' => 'Rizal Street, Roxas City, Capiz 5800',
                'phone'   => '+63 36 621-XXXX',
                'email'   => 'info@roxascarrental.com',
                'tin'     => '000-000-000-000',
            ],
        ])->setPaper('a4', 'portrait');

        return $pdf->download("invoice-{$booking->booking_ref}.pdf");
    }
}

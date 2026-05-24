<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #333; margin: 0; padding: 20px; }
  .header { display: table; width: 100%; margin-bottom: 20px; }
  .header-left { display: table-cell; vertical-align: top; }
  .header-right { display: table-cell; vertical-align: top; text-align: right; }
  .company-name { font-size: 20px; font-weight: bold; color: #1a1a2e; }
  .invoice-title { font-size: 24px; font-weight: bold; color: #e74c3c; }
  .divider { border: none; border-top: 2px solid #e74c3c; margin: 15px 0; }
  .section { margin-bottom: 16px; }
  .section-title { font-weight: bold; background: #f0f0f0; padding: 5px 8px; margin-bottom: 6px; }
  table.info { width: 100%; }
  table.info td { padding: 3px 6px; vertical-align: top; }
  table.info td:first-child { color: #666; width: 40%; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
  table.items th { background: #1a1a2e; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
  table.items td { padding: 8px 10px; border-bottom: 1px solid #eee; }
  table.items tr:nth-child(even) { background: #f9f9f9; }
  .total-row td { font-weight: bold; background: #f0f0f0; border-top: 2px solid #333; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
  .badge-paid { background: #d4edda; color: #155724; }
  .badge-pending { background: #fff3cd; color: #856404; }
  .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 12px; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="company-name">{{ $company['name'] }}</div>
    <div>{{ $company['address'] }}</div>
    <div>{{ $company['phone'] }} | {{ $company['email'] }}</div>
    <div>TIN: {{ $company['tin'] }}</div>
  </div>
  <div class="header-right">
    <div class="invoice-title">INVOICE</div>
    <div><strong>Ref:</strong> {{ $booking->booking_ref }}</div>
    <div><strong>Date:</strong> {{ $booking->created_at->format('M d, Y') }}</div>
    <div>
      <span class="badge {{ $booking->payments->where('status','paid')->count() ? 'badge-paid' : 'badge-pending' }}">
        {{ $booking->payments->where('status','paid')->count() ? 'PAID' : 'PENDING' }}
      </span>
    </div>
  </div>
</div>

<hr class="divider">

<div class="section">
  <div class="section-title">Customer Information</div>
  <table class="info">
    <tr><td>Name</td><td>{{ $booking->user->name }}</td></tr>
    <tr><td>Email</td><td>{{ $booking->user->email }}</td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">Rental Details</div>
  <table class="info">
    <tr><td>Vehicle</td><td>{{ $booking->vehicle->make }} {{ $booking->vehicle->model }} ({{ $booking->vehicle->year }})</td></tr>
    <tr><td>Plate Number</td><td>{{ $booking->vehicle->plate_number }}</td></tr>
    <tr><td>Pickup</td><td>{{ $booking->pickup_datetime->format('M d, Y h:i A') }} — {{ $booking->pickup_location }}</td></tr>
    <tr><td>Return</td><td>{{ $booking->dropoff_datetime->format('M d, Y h:i A') }} — {{ $booking->dropoff_location }}</td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">Charges</div>
  <table class="items">
    <thead>
      <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Rental — {{ $booking->vehicle->make }} {{ $booking->vehicle->model }}</td>
        <td style="text-align:right">₱{{ number_format($booking->base_amount, 2) }}</td>
      </tr>
      @if($booking->discount_amount > 0)
      <tr>
        <td>Discount</td>
        <td style="text-align:right; color:#27ae60">-₱{{ number_format($booking->discount_amount, 2) }}</td>
      </tr>
      @endif
      @if($booking->late_penalty > 0)
      <tr>
        <td>Late Return Penalty</td>
        <td style="text-align:right; color:#e74c3c">+₱{{ number_format($booking->late_penalty, 2) }}</td>
      </tr>
      @endif
      <tr class="total-row">
        <td>TOTAL DUE</td>
        <td style="text-align:right">₱{{ number_format($booking->total_amount, 2) }}</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="footer">
  Thank you for choosing {{ $company['name'] }}! &nbsp;|&nbsp; Roxas City, Capiz, Philippines &nbsp;|&nbsp;
  This is a system-generated invoice.
</div>

</body>
</html>

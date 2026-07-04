<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserController;

Route::prefix('v1')->group(function () {

    // Public
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    // PayMongo webhook — no auth
    Route::post('/webhooks/paymongo', [WebhookController::class, 'paymongo']);

    // Protected
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);

        // Vehicles
        Route::get('/vehicles/available', [VehicleController::class, 'available']);
        Route::get('/vehicles',           [VehicleController::class, 'index']);
        Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show']);

        // Bookings
        Route::get('/bookings',                      [BookingController::class, 'index']);
        Route::post('/bookings',                     [BookingController::class, 'store']);
        Route::get('/bookings/{booking}',            [BookingController::class, 'show']);
        Route::patch('/bookings/{booking}/complete', [BookingController::class, 'complete']);
        Route::patch('/bookings/{booking}/cancel',   [BookingController::class, 'cancel']);

        // Payments
        Route::post('/payments/simulate', [PaymentController::class, 'simulate']);
        Route::post('/payments/intent',   [PaymentController::class, 'createIntent']);
        Route::post('/payments/source',   [PaymentController::class, 'createSource']);

        // Invoice
        Route::get('/bookings/{booking}/invoice', [InvoiceController::class, 'download']);

        // Profile
        Route::get('/profile',   [CustomerController::class, 'show']);
        Route::patch('/profile', [CustomerController::class, 'update']);

        // Admin only
        Route::prefix('admin')->group(function () {
            Route::get('/bookings',                    [BookingController::class, 'adminIndex']);
            Route::get('/customers',                   [CustomerController::class, 'index']);
            Route::get('/customers/{customer}',        [CustomerController::class, 'show']);
            Route::get('/reports/financial',           [PaymentController::class, 'financialReport']);
            Route::get('/logs',                        [AuditLogController::class, 'index']);

            // User management
            Route::get('/users',              [UserController::class, 'index']);
            Route::post('/users',             [UserController::class, 'store']);
            Route::get('/users/{user}',       [UserController::class, 'show']);
            Route::put('/users/{user}',       [UserController::class, 'update']);
            Route::delete('/users/{user}',    [UserController::class, 'destroy']);

            // Vehicles
            Route::post('/vehicles',                   [VehicleController::class, 'store']);
            Route::put('/vehicles/{vehicle}',          [VehicleController::class, 'update']);
            Route::delete('/vehicles/{vehicle}',       [VehicleController::class, 'destroy']);
            Route::patch('/vehicles/{vehicle}/status', [VehicleController::class, 'updateStatus']);
        });
    });
});

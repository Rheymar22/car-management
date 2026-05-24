<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(): JsonResponse
    {
        $customers = CustomerProfile::with('user:id,name,email')->paginate(20);
        return response()->json($customers);
    }

    public function show(Request $request, ?CustomerProfile $customer = null): JsonResponse
    {
        $profile = $customer ?? $request->user()->customerProfile;
        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }
        return response()->json([
            'profile' => $profile->makeHidden([
                'license_number_encrypted',
                'license_expiry_encrypted',
            ]),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $profile = $request->user()->customerProfile;
        $data = $request->validate([
            'first_name'             => ['sometimes', 'string'],
            'last_name'              => ['sometimes', 'string'],
            'phone'                  => ['sometimes', 'string', 'max:20'],
            'address'                => ['sometimes', 'string'],
            'emergency_contact_name' => ['nullable', 'string'],
        ]);
        $profile->update($data);
        return response()->json(['profile' => $profile->refresh()]);
    }
}

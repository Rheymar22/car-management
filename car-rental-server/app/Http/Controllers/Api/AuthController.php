<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\AuditLog;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'              => $request->name,
            'email'             => $request->email,
            'password'          => Hash::make($request->password),
            'role'              => 'customer',
            'terms_accepted'    => true,
            'terms_accepted_at' => now(),
            'terms_ip'          => $request->ip(),
        ]);

        CustomerProfile::create([
            'user_id'    => $user->id,
            'first_name' => $request->first_name ?? $request->name,
            'last_name'  => $request->last_name ?? '',
            'phone'      => $request->phone ?? null,
        ]);

        AuditLog::record('register', $user->id, $request);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'token'   => $token,
            'user'    => $user->only(['id', 'name', 'email', 'role']),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            AuditLog::record('login_failed', null, $request, ['email' => $request->email]);
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        AuditLog::record('login_success', $user->id, $request);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user->only(['id', 'name', 'email', 'role']),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        AuditLog::record('logout', $request->user()->id, $request);
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user'    => $request->user()->only(['id', 'name', 'email', 'role']),
            'profile' => $request->user()->customerProfile,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::with('user:id,name,email')
            ->when($request->event, fn($q) => $q->where('event', $request->event))
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('email', 'like', '%' . $request->search . '%')
                  ->orWhere('ip_address', 'like', '%' . $request->search . '%');
            }))
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($logs);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    public function index(): JsonResponse
    {
        $vehicles = Vehicle::select([
            'id',
            'make',
            'model',
            'year',
            'type',
            'plate_number',
            'daily_rate',
            'hourly_rate',
            'weekly_rate',
            'status',
            'image_path',
            'features',
            'color'
        ])->paginate(12);
        return response()->json($vehicles);
    }

    public function show(Vehicle $vehicle): JsonResponse
    {
        return response()->json(['vehicle' => $vehicle]);
    }

    public function available(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end'   => ['required', 'date', 'after:start'],
            'type'  => ['nullable', Rule::in(['sedan', 'suv', 'van', 'motorcycle', 'truck'])],
        ]);

        $start = Carbon::parse($request->start);
        $end   = Carbon::parse($request->end);

        $vehicles = Vehicle::availableBetween($start, $end)
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->select([
                'id',
                'make',
                'model',
                'year',
                'type',
                'plate_number',
                'daily_rate',
                'hourly_rate',
                'weekly_rate',
                'status',
                'image_path',
                'features',
                'color'
            ])
            ->paginate(12);

        return response()->json($vehicles);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plate_number' => ['required', 'string', 'unique:vehicles'],
            'make'         => ['required', 'string'],
            'model'        => ['required', 'string'],
            'year'         => ['required', 'integer', 'min:2000', 'max:2030'],
            'color'        => ['required', 'string'],
            'type'         => ['required', Rule::in(['sedan', 'suv', 'van', 'motorcycle', 'truck'])],
            'daily_rate'   => ['required', 'numeric', 'min:0'],
            'hourly_rate'  => ['nullable', 'numeric', 'min:0'],
            'weekly_rate'  => ['nullable', 'numeric', 'min:0'],
            'features'     => ['nullable', 'array'],
            'image'        => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('vehicles', 'public');
        }

        unset($data['image']); // remove from data before create
        $vehicle = Vehicle::create($data);
        return response()->json(['vehicle' => $vehicle], 201);
    }

    public function update(Request $request, Vehicle $vehicle): JsonResponse
    {
        $data = $request->validate([
            'make'        => ['sometimes', 'string'],
            'model'       => ['sometimes', 'string'],
            'year'        => ['sometimes', 'integer', 'min:2000', 'max:2030'],
            'color'       => ['sometimes', 'string'],
            'type' => ['nullable', Rule::in(['sedan', 'suv', 'van', 'sports car', 'truck', 'pickup', 'minivan'])],            'plate_number' => ['sometimes', 'string', Rule::unique('vehicles')->ignore($vehicle->id)],
            'daily_rate'  => ['sometimes', 'numeric', 'min:0'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0'],
            'weekly_rate' => ['nullable', 'numeric', 'min:0'],
            'features'    => ['nullable', 'array'],
            'image'       => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        // Handle image upload — delete old image first
        if ($request->hasFile('image')) {
            if ($vehicle->image_path) {
                Storage::disk('public')->delete($vehicle->image_path);
            }
            $data['image_path'] = $request->file('image')->store('vehicles', 'public');
        }

        unset($data['image']);
        $vehicle->update($data);
        return response()->json(['vehicle' => $vehicle->refresh()]);
    }

    public function updateStatus(Request $request, Vehicle $vehicle): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::in(['available', 'maintenance', 'retired'])],
            'notes'  => ['nullable', 'string', 'max:500'],
        ]);
        $vehicle->update([
            'status'          => $request->status,
            'condition_notes' => $request->notes,
        ]);
        return response()->json(['vehicle' => $vehicle->refresh()]);
    }

    public function destroy(Vehicle $vehicle): JsonResponse
    {
        // Delete image from storage when vehicle is deleted
        if ($vehicle->image_path) {
            Storage::disk('public')->delete($vehicle->image_path);
        }
        $vehicle->delete();
        return response()->json(['message' => 'Vehicle removed.']);
    }
}

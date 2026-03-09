<?php

namespace App\Http\Controllers;

use App\Models\ATM;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ATMController extends Controller
{
    public function nearby(Request $request): JsonResponse
    {
        $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'radius' => ['nullable', 'numeric', 'min:0.1', 'max:100'],
        ]);

        $lat = (float) $request->lat;
        $lng = (float) $request->lng;
        $radius = (float) ($request->radius ?? 10);

        // PHP-based Haversine (SQLite-compatible)
        $atms = ATM::all()->map(function ($atm) use ($lat, $lng) {
            $atm->distance_km = round($this->haversine($lat, $lng, $atm->latitude, $atm->longitude), 2);
            return $atm;
        })->filter(fn ($atm) => $atm->distance_km <= $radius)
          ->sortBy('distance_km')
          ->values();

        return response()->json(['data' => $atms]);
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}

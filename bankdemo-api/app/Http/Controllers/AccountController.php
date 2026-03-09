<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $account = $request->user()->account;

        if (! $account) {
            return response()->json(['message' => 'No account found'], 404);
        }

        return response()->json($account);
    }
}

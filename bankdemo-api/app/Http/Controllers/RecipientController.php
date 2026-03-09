<?php

namespace App\Http\Controllers;

use App\Models\Recipient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $recipients = $request->user()->recipients()->orderBy('name')->get();

        return response()->json(['data' => $recipients]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:255', 'exists:accounts,account_number'],
        ], [
            'account_number.exists' => 'Ce numéro de compte est introuvable.',
        ]);

        $recipient = $request->user()->recipients()->create([
            'name'           => $request->name,
            'account_number' => $request->account_number,
        ]);

        return response()->json($recipient, 201);
    }

    public function destroy(Request $request, Recipient $recipient): JsonResponse
    {
        if ($recipient->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $recipient->delete();

        return response()->json(['message' => 'Bénéficiaire supprimé']);
    }
}

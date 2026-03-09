<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Account;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Register a new user, create an account, return Sanctum token.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Auto-create bank account
        Account::create([
            'user_id'        => $user->id,
            'account_number' => 'ACC' . str_pad((string) $user->id, 8, '0', STR_PAD_LEFT),
            'balance'        => 0.00,
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        Notification::create([
            'user_id' => $user->id,
            'type'    => 'info',
            'title'   => 'Bienvenue !',
            'message' => 'Votre compte BankDemo a été créé avec succès.',
        ]);

        return response()->json([
            'token' => $token,
            'user'  => $user->only('id', 'name', 'email'),
        ], 201);
    }

    /**
     * Login with email/password, return Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        $token = $user->createToken('auth')->plainTextToken;

        Notification::create([
            'user_id' => $user->id,
            'type'    => 'security',
            'title'   => 'Nouvelle connexion',
            'message' => 'Connexion détectée sur votre compte.',
        ]);

        return response()->json([
            'token' => $token,
            'user'  => $user->only('id', 'name', 'email'),
        ]);
    }

    /**
     * Logout — revoke current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    /**
     * Get authenticated user profile.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json($user->only('id', 'name', 'email'));
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        if (! Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Le mot de passe actuel est incorrect'], 422);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);

        Notification::create([
            'user_id' => $request->user()->id,
            'type'    => 'security',
            'title'   => 'Mot de passe modifié',
            'message' => 'Votre mot de passe a été changé avec succès.',
        ]);

        return response()->json(['message' => 'Mot de passe modifié avec succès']);
    }

    /**
     * Revoke only the current access token.
     */
    public function revokeCurrentToken(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Jeton actuel révoqué']);
    }

    /**
     * Revoke all access tokens for the authenticated user.
     */
    public function revokeAllTokens(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Toutes les sessions ont été révoquées']);
    }

    /**
     * Verify the user's password (for sensitive operations like PIN reveal).
     */
    public function verifyPassword(Request $request): JsonResponse
    {
        $request->validate(['password' => 'required|string']);

        if (! Hash::check($request->password, $request->user()->password)) {
            return response()->json(['message' => 'Mot de passe incorrect'], 422);
        }

        return response()->json(['verified' => true]);
    }
}

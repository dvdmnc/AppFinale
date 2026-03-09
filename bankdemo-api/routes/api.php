<?php

use Illuminate\Support\Facades\Route;

// Public routes (rate limited)
Route::middleware('throttle:auth')->group(function () {
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);
    Route::post('/register', [\App\Http\Controllers\AuthController::class, 'register']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
    Route::get('/user', [\App\Http\Controllers\AuthController::class, 'user']);
    Route::post('/change-password', [\App\Http\Controllers\AuthController::class, 'changePassword']);
    Route::post('/revoke-token', [\App\Http\Controllers\AuthController::class, 'revokeCurrentToken']);
    Route::post('/revoke-all-tokens', [\App\Http\Controllers\AuthController::class, 'revokeAllTokens']);
    Route::post('/verify-password', [\App\Http\Controllers\AuthController::class, 'verifyPassword']);

    Route::get('/account', [\App\Http\Controllers\AccountController::class, 'show']);
    Route::get('/transactions', [\App\Http\Controllers\TransactionController::class, 'index']);

    // Transaction endpoints (rate limited)
    Route::middleware('throttle:transactions')->group(function () {
        Route::post('/transactions/send', [\App\Http\Controllers\TransactionController::class, 'send']);
        Route::post('/transactions/deposit', [\App\Http\Controllers\TransactionController::class, 'deposit']);
    });

    Route::get('/atms/nearby', [\App\Http\Controllers\ATMController::class, 'nearby']);

    Route::get('/recipients', [\App\Http\Controllers\RecipientController::class, 'index']);
    Route::post('/recipients', [\App\Http\Controllers\RecipientController::class, 'store']);
    Route::delete('/recipients/{recipient}', [\App\Http\Controllers\RecipientController::class, 'destroy']);

    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
});

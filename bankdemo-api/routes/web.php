<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['app' => 'BankDemo API', 'version' => '1.0.0']);
});

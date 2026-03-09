<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Log suspicious activity: failed auth attempts, validation failures on transaction endpoints.
 */
class LogSuspiciousActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $status = $response->getStatusCode();
        $path = $request->path();

        // Log failed logins
        if (str_contains($path, 'login') && $status === 401) {
            Log::warning('Failed login attempt', [
                'ip'    => $request->ip(),
                'email' => $request->input('email'),
                'ua'    => $request->userAgent(),
            ]);
        }

        // Log rate-limited requests
        if ($status === 429) {
            Log::warning('Rate limit exceeded', [
                'ip'   => $request->ip(),
                'path' => $path,
                'user' => $request->user()?->id,
            ]);
        }

        // Log suspicious transaction attempts (validation failures)
        if (str_contains($path, 'transactions') && $status === 422) {
            Log::notice('Transaction validation failed', [
                'ip'   => $request->ip(),
                'path' => $path,
                'user' => $request->user()?->id,
                'body' => $request->except(['password']),
            ]);
        }

        return $response;
    }
}

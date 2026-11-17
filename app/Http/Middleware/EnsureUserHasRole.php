<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            abort(401, 'Unauthenticated.');
        }

        $user = $request->user();

        // Admin has universal access
        if ($user->isAdmin()) {
            return $next($request);
        }

        if (in_array('organizer', $roles, true) && $user->isOrganizer()) {
            return $next($request);
        }

        if (in_array($user->role, $roles, true)) {
            return $next($request);
        }

        abort(403, 'Unauthorized. This area requires '.implode(' or ', $roles).' privileges.');
    }
}

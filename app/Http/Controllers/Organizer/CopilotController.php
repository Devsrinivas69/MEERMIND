<?php

namespace App\Http\Controllers\Organizer;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\OrganizerCopilotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CopilotController extends Controller
{
    public function __construct(
        protected OrganizerCopilotService $copilotService
    ) {}

    /**
     * Handle natural-language organizer copilot queries grounded in live event data.
     */
    public function query(Request $request, Event $event): JsonResponse
    {
        // 1. Authorization: user must own event or be admin
        $user = $request->user();
        if ($event->organizer_id !== $user->id && ! $user->isAdmin()) {
            abort(403, 'Unauthorized. You may only query copilot data for your own events.');
        }

        // 2. Validation
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        // 3. Execution
        $response = $this->copilotService->ask($event, $user, $validated['message']);

        return response()->json([
            'success' => true,
            'event_id' => $event->id,
            'reply' => $response['reply'],
            'actions' => $response['actions'],
            'metrics' => $response['metrics'],
        ]);
    }
}

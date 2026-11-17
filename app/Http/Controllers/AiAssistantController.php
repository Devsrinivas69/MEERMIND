<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\EventAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    public function __construct(
        protected EventAiService $aiService,
    ) {}

    /**
     * Ask a question about an event to the AI assistant.
     */
    public function ask(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:500'],
            'session_id' => ['nullable', 'string', 'max:100'],
        ]);

        $event = Event::where('slug', $slug)
            ->published()
            ->firstOrFail();

        $result = $this->aiService->askAssistant(
            event: $event,
            question: $request->input('message'),
            sessionId: $request->input('session_id'),
            user: $request->user()
        );

        return response()->json([
            'success' => true,
            'reply' => $result['reply'],
            'conversation_id' => $result['conversation_id'],
        ]);
    }
}

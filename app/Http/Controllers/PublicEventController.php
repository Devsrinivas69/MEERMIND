<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\Registration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicEventController extends Controller
{
    /**
     * Display public catalog of published events.
     */
    public function index(Request $request): Response
    {
        $query = Event::query()
            ->published()
            ->with(['category', 'organizer'])
            ->orderBy('is_featured', 'desc')
            ->orderBy('starts_at', 'asc');

        // Search query
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('venue_city', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($categorySlug = $request->input('category')) {
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }

        // Event type filter
        if ($type = $request->input('type')) {
            $query->where('event_type', $type);
        }

        // Timing filter
        $timing = $request->input('timing', 'upcoming');
        if ($timing === 'upcoming') {
            $query->where('ends_at', '>=', now());
        } elseif ($timing === 'past') {
            $query->where('ends_at', '<', now());
        }

        $events = $query->paginate(12)->withQueryString();
        $categories = EventCategory::withCount(['events' => fn ($q) => $q->published()])->get();

        return Inertia::render('events/index', [
            'events' => $events,
            'categories' => $categories,
            'filters' => [
                'search' => $request->input('search', ''),
                'category' => $request->input('category', ''),
                'type' => $request->input('type', ''),
                'timing' => $timing,
            ],
        ]);
    }

    /**
     * Display single public event details.
     */
    public function show(Request $request, string $slug): Response
    {
        $event = Event::where('slug', $slug)
            ->with(['category', 'organizer'])
            ->firstOrFail();

        // Check if current user has an application/registration
        $userRegistration = null;
        $userTicket = null;

        if ($request->user()) {
            $userRegistration = $event->registrations()
                ->where('user_id', $request->user()->id)
                ->where('status', '!=', Registration::STATUS_CANCELLED)
                ->with('ticket')
                ->latest()
                ->first();

            if ($userRegistration && $userRegistration->isApproved()) {
                $userTicket = $userRegistration->ticket;
            }
        }

        // Related upcoming events
        $relatedEvents = Event::published()
            ->where('id', '!=', $event->id)
            ->where('ends_at', '>=', now())
            ->when($event->category_id, fn ($q) => $q->where('category_id', $event->category_id))
            ->with('category')
            ->take(3)
            ->get();

        return Inertia::render('events/show', [
            'event' => $event,
            'userRegistration' => $userRegistration,
            'isRegistered' => $userRegistration ? $userRegistration->isApproved() : false,
            'isPending' => $userRegistration ? $userRegistration->isPending() : false,
            'isWaitlisted' => $userRegistration ? $userRegistration->isWaitlisted() : false,
            'isRejected' => $userRegistration ? $userRegistration->isRejected() : false,
            'userTicket' => $userTicket,
            'relatedEvents' => $relatedEvents,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Organizer;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use App\Models\EventCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Display a listing of organizer's events.
     */
    public function index(Request $request): Response
    {
        $events = Event::where('organizer_id', $request->user()->id)
            ->with(['category'])
            ->withCount(['registrations', 'checkIns'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('organizer/events/index', [
            'events' => $events,
        ]);
    }

    /**
     * Show form for creating a new event.
     */
    public function create(): Response
    {
        $categories = EventCategory::orderBy('name')->get();

        return Inertia::render('organizer/events/create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created event in storage.
     */
    public function store(StoreEventRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Generate unique slug
        $slug = Str::slug($data['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Event::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-".$counter++;
        }
        $data['slug'] = $slug;
        $data['organizer_id'] = $request->user()->id;

        // Handle cover image upload if file is present
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('events', 'public');
            $data['cover_image'] = Storage::url($path);
        }

        $event = Event::create($data);

        return redirect()->route('organizer.events.index')
            ->with('success', "Event \"{$event->title}\" was successfully created.");
    }

    /**
     * Show the form for editing an event.
     */
    public function edit(Event $event): Response
    {
        $this->authorize('update', $event);

        $categories = EventCategory::orderBy('name')->get();

        return Inertia::render('organizer/events/edit', [
            'event' => $event,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified event.
     */
    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $this->authorize('update', $event);

        $data = $request->validated();

        // Update slug if title changed
        if ($data['title'] !== $event->title) {
            $slug = Str::slug($data['title']);
            $originalSlug = $slug;
            $counter = 1;
            while (Event::where('slug', $slug)->where('id', '!=', $event->id)->exists()) {
                $slug = "{$originalSlug}-".$counter++;
            }
            $data['slug'] = $slug;
        }

        // Handle cover image upload
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('events', 'public');
            $data['cover_image'] = Storage::url($path);
        }

        $event->update($data);

        return redirect()->route('organizer.events.index')
            ->with('success', "Event \"{$event->title}\" was updated successfully.");
    }

    /**
     * Remove the specified event from storage.
     */
    public function destroy(Event $event): RedirectResponse
    {
        $this->authorize('delete', $event);

        $event->delete();

        return redirect()->route('organizer.events.index')
            ->with('success', 'Event was archived.');
    }

    /**
     * Toggle event publication status.
     */
    public function togglePublish(Event $event): RedirectResponse
    {
        $this->authorize('update', $event);

        $newStatus = $event->status === Event::STATUS_PUBLISHED
            ? Event::STATUS_DRAFT
            : Event::STATUS_PUBLISHED;

        $event->update(['status' => $newStatus]);

        $statusLabel = $newStatus === Event::STATUS_PUBLISHED ? 'published' : 'moved to draft';

        return back()->with('success', "Event is now {$statusLabel}.");
    }
}

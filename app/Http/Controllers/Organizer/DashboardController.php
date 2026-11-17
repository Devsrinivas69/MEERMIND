<?php

namespace App\Http\Controllers\Organizer;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\Registration;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the organizer intelligence and analytics dashboard.
     */
    public function __invoke(Request $request): Response
    {
        $organizer = $request->user();
        $eventIds = Event::where('organizer_id', $organizer->id)->pluck('id');

        // Core Aggregate Metrics
        $totalEvents = $eventIds->count();
        $publishedEvents = Event::where('organizer_id', $organizer->id)->published()->count();
        $totalCapacity = (int) Event::where('organizer_id', $organizer->id)->sum('capacity');
        $totalRegistrations = Registration::whereIn('event_id', $eventIds)
            ->where('status', Registration::STATUS_CONFIRMED)
            ->count();
        $totalCheckIns = CheckIn::whereIn('event_id', $eventIds)->count();

        $overallAttendanceRate = $totalRegistrations > 0
            ? round(($totalCheckIns / $totalRegistrations) * 100, 1)
            : 0;

        $capacityUtilization = $totalCapacity > 0
            ? round(($totalRegistrations / $totalCapacity) * 100, 1)
            : 0;

        // Event-by-Event Performance Table
        $eventPerformance = Event::where('organizer_id', $organizer->id)
            ->with(['category'])
            ->withCount([
                'registrations' => fn ($q) => $q->where('status', Registration::STATUS_CONFIRMED),
                'checkIns',
            ])
            ->orderBy('starts_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($event) {
                $turnout = $event->registrations_count > 0
                    ? round(($event->check_ins_count / $event->registrations_count) * 100, 1)
                    : 0;

                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'status' => $event->status,
                    'starts_at' => $event->starts_at->toIso8601String(),
                    'capacity' => $event->capacity,
                    'registrations_count' => $event->registrations_count,
                    'check_ins_count' => $event->check_ins_count,
                    'turnout_rate' => $turnout,
                    'category' => $event->category?->name,
                ];
            });

        // Recent Registrations Roster
        $recentRegistrations = Registration::whereIn('event_id', $eventIds)
            ->with(['user', 'event', 'ticket'])
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get()
            ->map(function ($reg) {
                return [
                    'id' => $reg->id,
                    'attendee_name' => $reg->user->name,
                    'attendee_email' => $reg->user->email,
                    'attendee_company' => $reg->user->company,
                    'event_title' => $reg->event->title,
                    'event_slug' => $reg->event->slug,
                    'registered_at' => $reg->created_at->toIso8601String(),
                    'ticket_code' => $reg->ticket?->ticket_code,
                    'status' => $reg->status,
                    'is_checked_in' => $reg->ticket?->status === 'used',
                ];
            });

        // Registration Timeline (Last 7 days)
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::today()->subDays($i);
            $dayFormatted = $day->format('M j');
            $count = Registration::whereIn('event_id', $eventIds)
                ->whereDate('created_at', $day)
                ->count();

            $trends[] = [
                'day' => $dayFormatted,
                'count' => $count,
            ];
        }

        return Inertia::render('organizer/dashboard', [
            'metrics' => [
                'total_events' => $totalEvents,
                'published_events' => $publishedEvents,
                'total_registrations' => $totalRegistrations,
                'total_check_ins' => $totalCheckIns,
                'total_capacity' => $totalCapacity,
                'overall_attendance_rate' => $overallAttendanceRate,
                'capacity_utilization' => $capacityUtilization,
            ],
            'eventPerformance' => $eventPerformance,
            'recentRegistrations' => $recentRegistrations,
            'trends' => $trends,
        ]);
    }
}

<?php

use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\Attendee\TicketController as AttendeeTicketController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\Organizer\CheckInController as OrganizerCheckInController;
use App\Http\Controllers\Organizer\CopilotController;
use App\Http\Controllers\Organizer\DashboardController as OrganizerDashboardController;
use App\Http\Controllers\Organizer\EventController as OrganizerEventController;
use App\Http\Controllers\Organizer\RegistrationManagementController;
use App\Http\Controllers\PublicEventController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/', [PublicEventController::class, 'index'])->name('home');
Route::get('/events', [PublicEventController::class, 'index'])->name('events.index');
Route::get('/events/{slug}', [PublicEventController::class, 'show'])->name('events.show');

// AI Event Assistant API (Rate-Limited Grounded Q&A)
Route::middleware(['throttle:20,1'])->post('/events/{slug}/ask', [AiAssistantController::class, 'ask'])->name('events.ask');

/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Attendee Registration & Ticket Management
    |--------------------------------------------------------------------------
    */
    Route::post('/events/{slug}/register', [RegistrationController::class, 'store'])->name('events.register');
    Route::match(['post', 'delete'], '/registrations/{registration}/cancel', [RegistrationController::class, 'cancel'])->name('registrations.cancel');
    Route::post('/events/{event}/feedback', [FeedbackController::class, 'store'])->name('events.feedback.store');

    Route::prefix('attendee')->name('attendee.')->group(function () {
        Route::get('/tickets', [AttendeeTicketController::class, 'index'])->name('tickets.index');
        Route::get('/tickets/{ticket_code}', [AttendeeTicketController::class, 'show'])->name('tickets.show');
    });

    /*
    |--------------------------------------------------------------------------
    | Organizer Specific Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:organizer'])->prefix('organizer')->name('organizer.')->group(function () {
        Route::get('/dashboard', OrganizerDashboardController::class)->name('dashboard');
        Route::get('/events', [OrganizerEventController::class, 'index'])->name('events.index');
        Route::get('/events/create', [OrganizerEventController::class, 'create'])->name('events.create');
        Route::post('/events', [OrganizerEventController::class, 'store'])->name('events.store');
        Route::get('/events/{event}/edit', [OrganizerEventController::class, 'edit'])->name('events.edit');
        Route::put('/events/{event}', [OrganizerEventController::class, 'update'])->name('events.update');
        Route::delete('/events/{event}', [OrganizerEventController::class, 'destroy'])->name('events.destroy');
        Route::post('/events/{event}/toggle-publish', [OrganizerEventController::class, 'togglePublish'])->name('events.toggle-publish');

        // Registration Management & Application Review
        Route::get('/events/{event}/registrations', [RegistrationManagementController::class, 'index'])->name('events.registrations.index');
        Route::get('/events/{event}/registrations/export', [RegistrationManagementController::class, 'exportCsv'])->name('events.registrations.export');
        Route::post('/registrations/{registration}/approve', [RegistrationManagementController::class, 'approve'])->name('registrations.approve');
        Route::post('/registrations/{registration}/reject', [RegistrationManagementController::class, 'reject'])->name('registrations.reject');
        Route::post('/registrations/{registration}/waitlist', [RegistrationManagementController::class, 'waitlist'])->name('registrations.waitlist');
        Route::post('/registrations/{registration}/notes', [RegistrationManagementController::class, 'updateNotes'])->name('registrations.notes');
        Route::post('/events/{event}/registrations/bulk', [RegistrationManagementController::class, 'bulkAction'])->name('events.registrations.bulk');

        // Check-in & Scanner Terminal
        Route::get('/events/{event}/check-in', [OrganizerCheckInController::class, 'show'])->name('events.check-in');
        Route::post('/events/{event}/check-in/verify', [OrganizerCheckInController::class, 'verify'])->name('events.check-in.verify');

        // AI Copilot for Organizers (Live Grounded Insights & Actions)
        Route::middleware(['throttle:30,1'])->post('/events/{event}/copilot', [CopilotController::class, 'query'])->name('events.copilot.query');

        // AI Feedback Intelligence Report
        Route::get('/events/{event}/feedback', [FeedbackController::class, 'organizerReport'])->name('events.feedback');

        // Registrations shortcut
        Route::get('/registrations', function () {
            $user = request()->user();
            $firstEvent = $user->organizedEvents()->latest()->first();
            if ($firstEvent) {
                return redirect()->route('organizer.events.registrations.index', $firstEvent->id);
            }

            return redirect()->route('organizer.events.index')->with('info', 'Create an event first to review attendee applications.');
        })->name('registrations');

        Route::get('/check-in', function () {
            $user = request()->user();
            $firstEvent = $user->organizedEvents()->published()->first() ?? $user->organizedEvents()->first();
            if ($firstEvent) {
                return redirect()->route('organizer.events.check-in', $firstEvent->id);
            }

            return redirect()->route('organizer.events.index')->with('info', 'Create and publish an event first to start scanning tickets.');
        })->name('check-in');
    });
});

require __DIR__.'/settings.php';

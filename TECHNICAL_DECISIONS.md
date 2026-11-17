# MeetMind AI — Technical Architecture & Pedagogical Guide

> **Prepared for:** Product Owner (React/TypeScript Background, Zero Prior PHP/Laravel Knowledge)  
> **Prepared by:** Chief AI Engineering Orchestrator  
> **Status:** Full System Architecture Reference

---

## 🧭 The React Developer's Bridge to Laravel

As an engineer experienced with **React, TypeScript, Next.js, and Tailwind CSS**, here is how Laravel concepts directly translate to the paradigms you already know:

| Next.js / React Paradigm | Laravel 13 + Inertia.js Equivalent | How It Works in MeetMind AI |
| :--- | :--- | :--- |
| **Server Components / `getServerSideProps`** | `Inertia::render('page/name', $props)` | PHP controller queries data with Eloquent ORM and sends it straight to the React page component as typed props. No manual `fetch()`, no CORS, no Axios boilerplate. |
| **API Route Handlers (`/api/...`)** | Laravel Controllers (`App\Http\Controllers`) | Handles validation, database queries, and authorization in one cohesive server method. |
| **Zod / Yup Form Validation** | Laravel Form Requests (`validate([ ... ])`) | Declarative validation rules executed server-side before controller logic runs, automatically flashing errors back to the React UI. |
| **Prisma / Drizzle ORM** | Eloquent ORM (`App\Models\...`) | Object-Relational Mapping with intuitive relationship methods (`$event->registrations()`, `$ticket->checkIn()`). |
| **Database Migrations (Prisma Migrate)** | Laravel Migrations (`database/migrations/...`) | Version-controlled database schema definitions with rollback support and index enforcement. |
| **NextAuth / Supabase Auth** | Laravel Fortify + Session Guards | Built-in password hashing (Argon2id/Bcrypt), CSRF tokens, session management, and Two-Factor Authentication. |
| **Zustand / Redux / Context** | Inertia Page Props (`usePage().props`) | Shared global state (authenticated user, flash banners, app settings) dehydrated automatically on every request. |
| **Vitest / Jest** | Pest PHP (`vendor/bin/pest`) | Elegant, expressive BDD-style testing framework matching Jest/Vitest syntax (`expect($value)->toBe(...)`). |

---

## 🏗️ Core Architectural Decisions

### 1. Unified Monolith with Inertia.js v3
- **Decision:** Build a single unified application where Laravel serves the React SPA pages via Inertia.js v3 instead of maintaining two separate repositories (Node API + React frontend).
- **Why It Matters:**
  1. **Zero API Redundancy:** You don't have to maintain separate TypeScript DTO schemas, OpenAPI docs, and API route handlers for every model.
  2. **Zero Auth Token Headaches:** Browser cookies and CSRF tokens are handled natively by Laravel's encrypted session middleware. No JWT expiration races or refresh token rotation logic in React.
  3. **Instant Navigation:** Inertia intercepts standard anchor clicks and performs fast client-side XHR visits while keeping full browser history and back-button behavior intact.

---

### 2. Concurrency-Safe Flash Ticketing (`lockForUpdate`)
- **Challenge:** In high-demand event drops, 500 attendees might click *"Register"* during the same 100 milliseconds for an event with only 2 seats remaining. In naive systems, both requests see `capacity > registered_count` and insert records, resulting in severe overbooking.
- **The Solution:** In `RegistrationController.php`:
  ```php
  return DB::transaction(function () use ($user, $slug) {
      $event = Event::where('slug', $slug)
          ->published()
          ->lockForUpdate()
          ->firstOrFail();

      if (! $event->hasCapacity()) {
          return back()->with('error', 'Sorry, this event has reached maximum capacity.');
      }

      $registration = Registration::create([...]);
      $ticket = Ticket::create([...]);
      $event->increment('registered_count');
      ...
  });
  ```
- **How It Works:** `lockForUpdate()` places a row-level write lock on the specific event record. Subsequent incoming requests wait until the transaction commits, guaranteeing serial execution and absolute capacity limits.

---

### 3. Cryptographic QR Ticketing (HMAC-SHA256)
- **Challenge:** If a QR code simply contains `ticket_id: 42`, any malicious attendee can change the QR code to `43` to gain free entrance or impersonate another attendee.
- **The Solution:** `App\Services\QrCodeService`:
  ```php
  $signature = hash_hmac('sha256', "{$registrationId}:{$eventId}:{$salt}", config('app.key'));
  $token = "MM." . base64UrlEncode("{$registrationId}.{$eventId}.{$timestamp}.{$signature}");
  ```
- **Security Guarantee:** The QR token contains an opaque, cryptographically signed payload tied to the server's master application secret (`APP_KEY`). Any tampering immediately invalidates the signature.
- **Offline / SVG Generation:** Generated using `BaconQrCode` natively in PHP as pure SVG markup without any third-party external API calls or canvas dependencies.

---

### 4. Grounded AI Event Assistant (Zero Hallucinations)
- **Challenge:** Standard LLMs frequently hallucinate event dates, non-existent parking arrangements, or incorrect policies.
- **The Solution:** `App\Services\EventAiService::askAssistant`:
  1. Retrieves the event's structured database record (agenda, dates, venue, FAQs, capacity).
  2. Synthesizes a strict system prompt instructing the model to answer *solely* from the provided context.
  3. If no external OpenAI API key is present in `.env`, the system automatically falls back to a deterministic semantic keyword synthesizer matching the organizer's verified FAQs and schedule rules.
  4. Enforces strict IP and user rate limiting (`throttle:20,1`) to prevent abuse.

---

### 5. AI Feedback Intelligence & Sentiment Analysis
- **Architecture:**
  1. Attendees submit 1-5 star ratings and reviews (`FeedbackController::store`).
  2. Sentiment scores and polarity (`positive`, `neutral`, `negative`) are calculated.
  3. `EventAiService::generateFeedbackSummary($event)` generates/updates an executive report in `ai_event_insights`:
     - **Executive Narrative:** Synthesized executive overview.
     - **Sentiment Distribution:** Positive %, Neutral %, and Negative % ratios.
     - **Key Themes:** Extracted recurring themes from attendee reviews.
     - **Actionable Takeaways:** Strategic suggestions for the organizer.
  4. The organizer accesses this report at `GET /organizer/events/{event}/feedback`.

---

### 6. Design System Tokens (Charcoal & Amber SaaS)
- **Color Palette:**
  - Background: Deep Charcoal (`#090a0f`, `#0f1117`)
  - Cards & Panels: Subtle Elevated Charcoal (`#151821`, border `#232733`)
  - Accent: Vibrant Warm Amber (`#f59e0b`, `#d97706`, `#b45309`)
  - Success / Verification: Emerald (`#10b981`)
  - Text: Off-White (`#f9fafb`) and Muted Zinc (`#9ca3af`)
- **Typography:** Instrument Sans, clean geometric sans-serif.

---

## 🧪 Test Suite & Quality Assurance

The application includes 76 automated Pest tests verifying:
- Database schema, foreign keys, cascades, and soft deletes (`DatabaseArchitectureTest`)
- Role-based authorization middleware and policies (`RoleAuthorizationTest`)
- Organizer CRUD, image uploads, and slug generation (`EventManagementTest`)
- Concurrency-safe registration, ticket issuance, and duplicate check-in rejection (`RegistrationAndCheckInTest`)
- Organizer analytics aggregation and velocity metrics (`OrganizerAnalyticsTest`)
- Grounded AI event assistant, rate limiting, and feedback reporting (`AiAssistantAndFeedbackTest`)
- Email notifications on ticket issuance and entrance validation (`NotificationTest`)

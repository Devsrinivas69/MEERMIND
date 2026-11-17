# MeetMind AI — Technical Architecture & Decisions

## Architectural Vision
MeetMind AI is built as a single, cohesive monolith leveraging Laravel 13 on the backend and React 19 + TypeScript on the frontend connected seamlessly via Inertia.js v2.

---

## Key Technical Decisions

### 1. Monolith with Inertia.js v2 instead of Separate React SPA
- **Decision:** Use Laravel + Inertia.js v2 instead of a decoupled Next.js/Vite frontend calling a REST/GraphQL API.
- **Why:** Eliminates API duplication, redundant DTO definitions, manual JWT/OAuth token refreshes, and CORS headaches. Inertia renders React components with typed props directly from PHP controllers.
- **For React Developers:** Think of Inertia as an invisible bridge: returning `Inertia::render('Events/Show', ['event' => $event])` serves the compiled React component with props already dehydrated, just like Next.js Server Components, but with Laravel's Eloquent ORM.

### 2. Database & Dialect Strategy: SQLite (Dev) -> MySQL (Prod)
- **Decision:** SQLite locally with WAL (Write-Ahead Logging) mode, maintaining standard ANSI SQL migrations compatible with MySQL 8.x / PostgreSQL.
- **Why:** Zero local database server setup for rapid development. Using standard Laravel Schema builder ensures clean deployment to MySQL / AWS RDS / Laravel Cloud later.

### 3. QR Code Cryptographic Security
- **Decision:** Use HMAC-SHA256 digital signatures inside QR codes (`base64Url(ticket_id + "." + timestamp + "." + signature)`).
- **Why:** Prevents attendees from forging tickets by guessing incremental IDs or copying someone else's QR code.
- **Validation:** The check-in scanner verifies the HMAC signature using the app's secret key before marking a ticket as used, preventing duplicate check-ins even if offline or scanned twice in rapid succession.

### 4. Concurrency Protection for Registrations
- **Decision:** Enforce database-level transactions with `DB::transaction()` and pessimistic locking (`lockForUpdate()`) or atomic decrement when registering.
- **Why:** In high-demand events (e.g., flash tickets), multiple attendees clicking "Register" at the same millisecond must not exceed the maximum capacity.

### 5. Grounded AI Architecture (Zero Hallucinations)
- **Decision:** Implement retrieval-grounded event context. When an attendee asks the AI assistant about an event, the system loads the structured event record (schedule, location, FAQs, prerequisites) and injects it as system context.
- **Guardrail:** The AI is strictly instructed to answer only from the provided event context and politely state when information is unavailable.

### 6. Design System Tokens (Charcoal & Amber)
- **Colors:**
  - Background: Dark Charcoal (`#0f1115` / `#16191f`)
  - Foreground: Off-White (`#f3f4f6` / `#e5e7eb`)
  - Accent: Amber / Warm Gold (`#f59e0b` / `#d97706` / `#b45309`)
  - Card/Surfaces: Muted Charcoal (`#1a1d24` / border `#272b35`)
- **Typography:** Instrument Sans / Inter clean geometric typography.

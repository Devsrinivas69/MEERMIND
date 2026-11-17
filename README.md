# MeetMind AI — AI-Powered Event Management & Intelligence Platform

MeetMind AI is a modern, high-performance SaaS platform for event organizers, conference producers, and technology communities. It combines event discovery, an application-review-approval registration lifecycle, digital QR ticketing, camera entrance check-in, real-time analytics, an attendee AI assistant, and an **AI Event Organizer Copilot** into a single unified application.

Built with **Laravel 13**, **PHP 8.5**, **React 19**, **Inertia.js**, **TypeScript**, **Tailwind CSS v4**, and **Pest**.

---

## 🌟 Key Capabilities

### 1. Public Event Discovery & Catalog
- **Instant Search & Filtering:** Filter by topic/category, format (*In-Person*, *Virtual*, *Hybrid*), and dates.
- **Detailed Event Pages:** Rich schedules, countdown timers, speaker details, venue coordinates, and remaining seat counters.
- **Attendee AI Assistant:** Grounded retrieval Q&A assistant answering attendee questions accurately using official event agendas and FAQs with zero hallucination.

### 2. Registration Workflow & Application Review Lifecycle
- **Application Submission:** Attendees apply to attend by submitting motivation notes and answering organizer-defined custom questions.
- **Pending Review State:** Submitting an application sets status to `PENDING` — no ticket is issued and no venue capacity is reserved until human review.
- **Organizer Registration Console:** Dedicated dashboard (`/organizer/events/{event}/registrations`) featuring:
  - Real-time KPI summary (Applications, Approved, Pending, Waitlist, Rejected, Available Capacity).
  - Multi-status filter tabs (`Pending`, `Approved`, `Waitlisted`, `Rejected`, `All`).
  - Search by applicant name or email.
  - Expandable custom question answers & inline internal review notes.
  - Single actions (Approve, Reject with custom reason, Waitlist).
  - Bulk actions toolbar (Bulk Approve, Bulk Reject, Bulk Waitlist) with strict capacity enforcement.
  - Streamed CSV roster download.
- **Concurrency-Safe Approvals:** Uses `lockForUpdate()` inside database transactions to atomically reserve capacity (`registered_count++`), transition status to `APPROVED`, issue cryptographically signed digital tickets, and notify attendees.
- **Waitlist & Rejection Flows:** Organizers can reject applicants with explicit feedback or move applicants to a priority waitlist.

### 3. The Standout Feature: AI Event Organizer Copilot
- **Live Database Grounding:** Seamlessly queries live database records for the organizer's events (pending applications, applicant backgrounds, remaining capacity, turnout rate, and attendee reviews).
- **Natural Language Interaction:** Ask questions like:
  - *"Show me all pending applications and summarize them"*
  - *"Are there any senior engineers or founders among the applicants?"*
  - *"How many seats are remaining?"*
  - *"Summarize attendee feedback"*
  - *"Draft an announcement email to waitlisted attendees"*
- **Action Suggestions with Human-in-the-Loop Confirmation:** The copilot proposes concrete actions (e.g., *"Approve Alex Rivera"* or *"Bulk Approve All"*). Write actions are never executed autonomously — a confirmation modal requires explicit organizer approval before updating live records.

### 4. Digital Tickets & QR Check-in Terminal
- **Cryptographically Signed Passes:** HMAC-SHA256 tokens embedded into high-resolution native SVG QR codes.
- **Attendee Boarding Pass:** Visual boarding pass with print/PDF styling and status badges (`PENDING REVIEW`, `APPROVED`, `WAITLISTED`, `REJECTED`).
- **Live QR Scanner Terminal:** Real-time video camera scanner with instant validation, attendance rate updates, and `409 Conflict` duplicate prevention.

### 5. Organizer Analytics & Intelligence
- **Executive Analytics Dashboard:** Turnout rates, capacity utilization %, 7-day registration velocity charts, and live entrance activity audit stream.
- **AI Feedback Intelligence:** Post-event attendee reviews (1-5 stars) with automated sentiment scoring, sentiment distribution, and executive summaries.

---

## 🛠️ Tech Stack

- **Backend:** Laravel 13, PHP 8.5, SQLite (Local Dev) / MySQL (Production), Laravel Fortify, Laravel AI SDK
- **Frontend:** React 19, TypeScript, Inertia.js, Tailwind CSS v4, shadcn/ui, Lucide React
- **Testing:** Pest PHP (93 unit & feature tests, 405 assertions, 100% passing)
- **Tooling:** Vite, Laravel Wayfinder, Laravel Boost, Laravel Pint

---

## 🚀 Local Development Setup

### Prerequisites
- PHP 8.3+ (installed via [Laravel Herd](https://herd.laravel.com/))
- Composer 2.x
- Node.js 20+ & npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Devsrinivas69/MEERMIND.git
cd MEERMIND

# 2. Install PHP dependencies
composer install

# 3. Install frontend dependencies
npm install

# 4. Configure environment
copy .env.example .env
php artisan key:generate

# 5. Run database migrations & seed demo data
php artisan migrate --seed

# 6. Build frontend assets
npm run build
```

### Running the Application

```bash
# Start the Laravel backend server
php artisan serve --port=8000

# (Optional for dev hot-reloading) In a separate terminal, start Vite:
npm run dev
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## 🔑 Demo Accounts

All demonstration accounts are pre-seeded with password: `password`

| Role | Name | Email | Password | Primary Capabilities to Test |
| :--- | :--- | :--- | :--- | :--- |
| **Organizer (Host)** | Sarah Lin | `sarah@meetmind.ai` | `password` | Organizer Dashboard, Application Review Console, AI Copilot, QR Check-in Scanner, AI Feedback Report |
| **Attendee (Applicant)** | Alex Rivera | `alex@example.com` | `password` | Event Discovery, Grounded AI Assistant, Apply to Attend, Digital Boarding Pass, Post-Event Review |
| **Super Admin** | Super Admin | `admin@meetmind.ai` | `password` | Platform Oversight & Global Administration |

Refer to [DEMO_SCRIPT.md](file:///c:/Users/srinivas/OneDrive/Desktop/MEETMIND/DEMO_SCRIPT.md) for a complete step-by-step walkthrough.

---

## 🧪 Automated Testing

MeetMind AI comes with a comprehensive test suite written in Pest PHP covering all authentication, event discovery, registration approval workflows, QR check-ins, notifications, and AI copilot operations:

```bash
vendor/bin/pest
```

```text
Tests:    93 passed (405 assertions)
Duration: ~7.5s
Result:   100% Green
```

To run only the registration approval workflow and AI copilot tests:
```bash
vendor/bin/pest tests/Feature/RegistrationApprovalWorkflowTest.php tests/Feature/OrganizerCopilotTest.php
```

---

## 📖 Additional Documentation

- [DEMO_SCRIPT.md](file:///c:/Users/srinivas/OneDrive/Desktop/MEETMIND/DEMO_SCRIPT.md) — Step-by-step 2-minute demonstration guide.
- [DEVELOPMENT_STATUS.md](file:///c:/Users/srinivas/OneDrive/Desktop/MEETMIND/DEVELOPMENT_STATUS.md) — Detailed breakdown of development phases and entity schemas.
- [TECHNICAL_DECISIONS.md](file:///c:/Users/srinivas/OneDrive/Desktop/MEETMIND/TECHNICAL_DECISIONS.md) — Plain-language explanations of Laravel backend patterns for React/TypeScript developers.

---

## 📄 License

The MeetMind AI platform is open-source software licensed under the [MIT License](LICENSE).

# MeetMind AI — AI-Powered Event Management & Intelligence Platform

MeetMind AI is a modern, high-performance SaaS platform for event organizers, conference producers, and technology communities. It combines event discovery, registration, digital QR ticketing, camera check-in, real-time analytics, and an intelligent event assistant into a single unified application.

Built with **Laravel 13**, **React 19**, **Inertia.js v2**, **TypeScript**, **Tailwind CSS v4**, and **Pest**.

---

## Features

- **Public Event Discovery:** Search, filter by category/date, responsive card grid, and rich event detail pages.
- **Organizer Event Management:** Create, publish, draft, edit venue/online coordinates, capacity limits, and deadlines.
- **Registration & Ticketing:** One-click registration with concurrency-safe capacity enforcement and instant ticket issuance.
- **Digital QR Tickets:** Cryptographically signed (HMAC-SHA256) QR tickets with visual pass card and print view.
- **Organizer QR Check-in:** Real-time camera scanner with instant validation, duplicate prevention, and manual fallback.
- **Organizer Analytics Dashboard:** Live metrics on registrations, check-in velocity, remaining capacity, and attendance trends.
- **AI Event Assistant:** Grounded retrieval Q&A assistant answering questions accurately from published event agendas and FAQs.
- **AI Feedback Intelligence:** Post-event attendee reviews with sentiment scoring and executive summaries for organizers.

---

## Tech Stack

- **Backend:** Laravel 13, PHP 8.5, SQLite (Dev) / MySQL (Production), Laravel Fortify, Laravel AI SDK
- **Frontend:** React 19, TypeScript, Inertia.js v2, Tailwind CSS v4, shadcn/ui, Lucide React
- **Testing:** Pest PHP (Automated unit & feature tests)
- **Tooling:** Vite, Laravel Wayfinder, Laravel Boost

---

## Local Development Setup

### Prerequisites
- PHP 8.3+ (installed via [Laravel Herd](https://herd.laravel.com/))
- Composer 2.x
- Node.js 20+ & npm

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/meetmind.git
cd meetmind

# Install backend dependencies
composer install

# Install frontend dependencies
npm install

# Setup environment
copy .env.example .env
php artisan key:generate

# Run migrations and seed sample data
php artisan migrate --seed

# Build frontend assets
npm run build
```

### Running the App
```bash
# Start the Laravel backend server
php artisan serve

# In a separate terminal, start Vite dev server
npm run dev
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## Demo Accounts

All demonstration accounts are seeded with password: `password`

| Role | Email | Password | Primary Capabilities to Test |
| :--- | :--- | :--- | :--- |
| **Organizer (Host)** | `sarah@meetmind.ai` | `password` | Organizer Dashboard, Create/Edit Events, QR Scanner Terminal, AI Feedback Report |
| **Attendee** | `alex@example.com` | `password` | Event Registration, Digital QR Ticket, Verified Review Submission |
| **Super Admin** | `admin@meetmind.ai` | `password` | Platform Oversight & Global Administration |

Refer to [DEMO_SCRIPT.md](file:///c:/Users/srinivas/OneDrive/Desktop/MEETMIND/DEMO_SCRIPT.md) for a complete 2-minute step-by-step walkthrough.

---

## Testing
```bash
./vendor/bin/pest
```

# MeetMind AI — Demonstration & Walkthrough Script

This script guides you through a complete, step-by-step demonstration of **MeetMind AI**, an AI-powered event management and intelligence SaaS platform.

---

## 🚀 Pre-Seeded Demonstration Accounts

All demo accounts come pre-seeded with encrypted test passwords (`password`):

| Role | Name | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Organizer (Host)** | Sarah Lin | `sarah@meetmind.ai` | `password` | Create/edit events, Live QR Check-in Terminal, Analytics Dashboard, AI Feedback Report |
| **Attendee (User)** | Alex Rivera | `alex@example.com` | `password` | Event discovery, Grounded AI Assistant, Registration, Digital QR Ticket, Verified Review |
| **Super Admin** | Super Admin | `admin@meetmind.ai` | `password` | Platform oversight, system management |

---

## 🎬 2-Minute End-to-End Walkthrough

### Act 1: Discovering Public Events & Asking the AI Event Assistant
1. **Navigate to:** `http://127.0.0.1:8000/events` (or home `/`).
2. **Explore the Catalog:**
   - Filter by categories: *Artificial Intelligence*, *Web Development*, *Cybersecurity*, or *Design*.
   - Filter by format: *In-Person*, *Virtual*, or *Hybrid*.
   - Search for *"Architecture"* or *"Summit"* to view instant keyword filtering.
3. **Open Event Details:**
   - Click on **"Next-Gen AI & LLM Architecture Summit 2026"**.
   - Notice the rich event metadata, countdown timer, venue address, and available seat counter.
4. **Interact with the Grounded AI Event Assistant:**
   - Click the floating amber **"Ask AI Assistant"** pill in the bottom-right corner.
   - Click prompt chip: *"Where can attendees park?"*
   - Notice the response: Grounded directly in the organizer's official FAQs (*"Validated attendee parking is available at the 5th & Mission garage"*), with zero hallucination.
   - Ask custom question: *"What time does the conference start?"* — The assistant replies with the exact local schedule.

---

### Act 2: Attendee Application with Custom Questions
1. **Apply for the Event:**
   - On the event detail page, click **"Apply to Attend"**.
   - (If not signed in, log in with `alex@example.com` / `password`).
   - The application dialog opens, collecting your background, motivation note, and custom questions defined by the organizer.
   - Click **"Submit Application"**.
   - The attendee sees: *"Your registration request has been submitted. Waiting for organizer approval."*
   - Status badge is set to `PENDING`. No ticket is generated yet and no capacity is reserved.
2. **Inspect Attendee Tickets & Requests:**
   - Navigate to `/attendee/tickets` to see the status tabs: `All Requests`, `Approved Tickets`, `Pending Review`, and `Waitlist`.
   - Alex's application is clearly badged as `PENDING REVIEW` with an informative explanation note.

---

### Act 3: Organizer Review, AI Copilot & Concurrency-Safe Approval
1. **Sign in as Event Organizer:**
   - Sign in as `sarah@meetmind.ai` / `password`.
   - Access the dedicated **"Review Applications"** management section at `/organizer/events/1/registrations` (accessible via sidebar or My Events).
2. **Engage with the Live AI Organizer Copilot:**
   - Click the **"AI Copilot"** button with the sparkle indicator.
   - Click quick prompt chip: *"Summarize pending applicants"* or *"Capacity & seat status"*.
   - Ask: *"Are there any senior engineers or founders among the applicants?"*
   - Copilot analyzes live database records with zero hallucination and surfaces candidates with suggested actions (e.g., *"Approve Alex Rivera"*).
   - Click **"Review & Run"** on the proposed action: A confirmation modal appears, ensuring human-in-the-loop verification before write execution.
3. **Approve Application & Issue Cryptographic Ticket:**
   - Click **"Approve"** on an application.
   - An atomic database transaction locks capacity, increments `registered_count`, transitions status to `APPROVED`, issues an HMAC-SHA256 signed digital ticket, and dispatches an approval notification email.
   - Bulk actions (Approve, Reject with reason, Waitlist) and CSV export are available.

---

### Act 4: Organizer Live QR Scanner Terminal & Duplicate Prevention
1. **Sign in as Event Organizer:**
   - In another browser tab/window or after switching users, sign in as `sarah@meetmind.ai` / `password`.
2. **Access the Live Check-In Terminal:**
   - Navigate to **"QR Check-In Scanner"** in the sidebar or `http://127.0.0.1:8000/organizer/check-in`.
   - The terminal activates the camera video feed (or provides a manual code input fallback).
3. **Scan / Enter Ticket Code:**
   - Enter Alex Rivera's ticket code or paste his signed token into the manual input.
   - Click **"Verify Entrance"**.
   - **Result:** Instant green success banner: *"Welcome, Alex Rivera! Check-in verified successfully."*
   - Live turnout statistics update immediately (Checked-in counter increments, attendance % recalculates).
4. **Test Security & Duplicate Prevention:**
   - Immediately attempt to enter the same ticket code again.
   - **Result:** Red warning banner: *"Duplicate Check-In! This ticket was already verified at [Timestamp] by Sarah Lin."*
   - Status code `409 Conflict` prevents duplicate badges or double entry.

---

### Act 4: Real-Time Organizer Analytics Dashboard
1. **Navigate to:** `http://127.0.0.1:8000/organizer/dashboard`.
2. **Key Metrics Display:**
   - **Total Registrations:** Aggregated across all organized events.
   - **Total Check-Ins & Attendance Turnout Rate:** Real-time percentage of confirmed attendees who checked in.
   - **Capacity Utilization:** Percentage of available seats booked.
3. **7-Day Registration Velocity Chart:**
   - Pure CSS/SVG bar chart visualizing daily attendee registration trends over the past 7 days.
4. **Live Activity Stream:**
   - Real-time audit log of recent registrations and check-in events.

---

### Act 5: Attendee Feedback & AI Feedback Intelligence
1. **Submit Attendee Review:**
   - As attendee Alex Rivera, visit `http://127.0.0.1:8000/attendee/tickets/MM-...`.
   - Scroll to the **"Event Feedback & Review"** card below the digital ticket.
   - Select **5 Stars** and type: *"The technical architecture sessions and live agent demonstrations were world-class! The parking was seamless."*
   - Click **"Submit Verified Review"**.
2. **Organizer AI Feedback Intelligence Report:**
   - As organizer Sarah Lin, navigate to `http://127.0.0.1:8000/organizer/events/1/feedback`.
   - View the **MeetMind AI Executive Synthesis**:
     - **Executive Narrative:** Synthesized summary of verified attendee submissions.
     - **Sentiment Breakdown:** Positive, Neutral, and Negative ratios with visual progress bars.
     - **Key Recurring Themes:** Extracted chips highlighting content depth, engagement, and pacing.
     - **Actionable Recommendations:** Bulleted suggestions generated by AI for future event iterations.
     - **Verified Reviews Feed:** Chronological list of attendee comments and ratings.

---

## 🛡️ Automated Verification Suite

To run the automated regression test suite covering all features:

```powershell
$env:Path = "C:\Users\srinivas\.config\herd\bin;" + $env:Path
vendor/bin/pest
```

**Result:** `76 tests passed, 309 assertions (100% passing)`.

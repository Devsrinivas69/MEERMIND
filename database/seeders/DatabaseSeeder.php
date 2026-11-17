<?php

namespace Database\Seeders;

use App\Models\AiEventInsight;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\Feedback;
use App\Models\Registration;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Core Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@meetmind.ai'],
            [
                'name' => 'MeetMind Admin',
                'password' => Hash::make('Password@123'),
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
                'company' => 'MeetMind AI Global',
                'job_title' => 'Chief Systems Administrator',
                'bio' => 'System administrator managing MeetMind platform governance.',
            ]
        );

        $organizer1 = User::firstOrCreate(
            ['email' => 'sarah@frontier.ai'],
            [
                'name' => 'Sarah Chen',
                'password' => Hash::make('Password@123'),
                'role' => User::ROLE_ORGANIZER,
                'email_verified_at' => now(),
                'company' => 'Frontier Intelligence Lab',
                'job_title' => 'Director of Events & Developer Relations',
                'bio' => 'Organizing high-impact technical conferences for AI innovators.',
            ]
        );

        $organizer2 = User::firstOrCreate(
            ['email' => 'marcus@cloudfoundry.dev'],
            [
                'name' => 'Marcus Vance',
                'password' => Hash::make('Password@123'),
                'role' => User::ROLE_ORGANIZER,
                'email_verified_at' => now(),
                'company' => 'CloudFoundry Collective',
                'job_title' => 'Principal Infrastructure Engineer',
                'bio' => 'DevOps enthusiast and community host for distributed systems.',
            ]
        );

        $attendee1 = User::firstOrCreate(
            ['email' => 'alex@example.com'],
            [
                'name' => 'Alex Rivera',
                'password' => Hash::make('Password@123'),
                'role' => User::ROLE_ATTENDEE,
                'email_verified_at' => now(),
                'company' => 'Pulse Tech',
                'job_title' => 'Senior Frontend Architect',
                'bio' => 'Specializes in React 19, TypeScript, and modern design systems.',
            ]
        );

        $attendee2 = User::firstOrCreate(
            ['email' => 'priya@example.com'],
            [
                'name' => 'Priya Patel',
                'password' => Hash::make('Password@123'),
                'role' => User::ROLE_ATTENDEE,
                'email_verified_at' => now(),
                'company' => 'Apex Cloud Labs',
                'job_title' => 'Machine Learning Engineer',
                'bio' => 'Working with autonomous agent architectures and LLM evals.',
            ]
        );

        $attendee3 = User::firstOrCreate(
            ['email' => 'david@example.com'],
            [
                'name' => 'David Kim',
                'password' => Hash::make('Password@123'),
                'role' => User::ROLE_ATTENDEE,
                'email_verified_at' => now(),
                'company' => 'Studio Kinetic',
                'job_title' => 'Product Designer',
                'bio' => 'Focused on craft, accessibility, and high-retention enterprise UI.',
            ]
        );

        // 2. Seed Event Categories
        $categories = [
            [
                'name' => 'Artificial Intelligence & ML',
                'slug' => 'ai-and-ml',
                'description' => 'Autonomous agents, foundation models, fine-tuning, and production AI engineering.',
                'icon' => 'Cpu',
                'color' => 'amber',
            ],
            [
                'name' => 'Cloud & Distributed Systems',
                'slug' => 'cloud-and-devops',
                'description' => 'Kubernetes, multi-region architecture, zero-downtime deployments, and edge compute.',
                'icon' => 'Cloud',
                'color' => 'sky',
            ],
            [
                'name' => 'Web & React Engineering',
                'slug' => 'web-and-react',
                'description' => 'Modern client architecture, React 19, server actions, and high-performance frontend.',
                'icon' => 'Code',
                'color' => 'emerald',
            ],
            [
                'name' => 'Product Architecture & Design',
                'slug' => 'product-and-design',
                'description' => 'UX design systems, micro-interactions, conversion optimization, and SaaS strategy.',
                'icon' => 'Sparkles',
                'color' => 'purple',
            ],
        ];

        $categoryModels = [];
        foreach ($categories as $cat) {
            $categoryModels[$cat['slug']] = EventCategory::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        // 3. Seed Events
        $event1 = Event::updateOrCreate(
            ['slug' => 'meetmind-ai-summit-2026'],
            [
                'organizer_id' => $organizer1->id,
                'category_id' => $categoryModels['ai-and-ml']->id,
                'title' => 'MeetMind AI Summit 2026: Autonomous Systems & Production LLMs',
                'summary' => 'The premier technical gathering for software engineers building autonomous AI workflows and scalable agent pipelines.',
                'description' => "Welcome to MeetMind AI Summit 2026 — where foundational research meets real-world enterprise software engineering.\n\n### What You Will Learn\n- **Multi-Agent Orchestration**: Coordinating specialized LLM agents with deterministic state machines.\n- **Grounding & Context Verification**: Eliminating hallucinations using retrieval-augmented verification.\n- **Low-Latency Streaming**: Implementing real-time token streaming and UI hydration with React 19.\n- **Security & Sandboxing**: Hardening LLM execution environments and preventing indirect prompt injection.\n\n### Event Schedule\n- **09:00 AM - 10:00 AM**: Registration, Coffee & Badge Pickup\n- **10:00 AM - 11:30 AM**: Keynote: The Architecture of Autonomous Software Teams\n- **11:45 AM - 01:00 PM**: Deep Dive: Laravel AI SDK & Reactive SPAs\n- **01:00 PM - 02:00 PM**: Executive Networking Lunch\n- **02:00 PM - 04:00 PM**: Hands-On Workshops & Hack Sprint\n- **04:15 PM - 05:30 PM**: Closing Panel & Open Source Showcases",
                'cover_image' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
                'event_type' => Event::TYPE_HYBRID,
                'venue_name' => 'Moscone West Convention Center',
                'venue_address' => '747 Howard St',
                'venue_city' => 'San Francisco, CA',
                'virtual_meeting_url' => 'https://meetmind.ai/live/summit-2026',
                'starts_at' => now()->addDays(14)->setHour(9)->setMinute(0),
                'ends_at' => now()->addDays(14)->setHour(18)->setMinute(0),
                'registration_deadline' => now()->addDays(13)->setHour(23)->setMinute(59),
                'capacity' => 250,
                'registered_count' => 3,
                'status' => Event::STATUS_PUBLISHED,
                'is_featured' => true,
                'ai_summary' => 'Comprehensive one-day summit exploring autonomous multi-agent systems, real-time streaming, and prompt security in San Francisco.',
                'ai_faqs' => [
                    ['question' => 'Is parking available at the venue?', 'answer' => 'Yes, Moscone Center garage offers all-day public parking directly across on 3rd Street.'],
                    ['question' => 'Will virtual attendees receive session recordings?', 'answer' => 'Yes, all registered attendees receive 4K access recordings and code repositories within 24 hours.'],
                    ['question' => 'What are the technical prerequisites for the afternoon hack sprint?', 'answer' => 'A laptop with Node 20+, Git, and your favorite IDE. WiFi and cloud sandbox keys are provided.'],
                ],
            ]
        );

        $event2 = Event::updateOrCreate(
            ['slug' => 'next-gen-cloud-systems-conf'],
            [
                'organizer_id' => $organizer2->id,
                'category_id' => $categoryModels['cloud-and-devops']->id,
                'title' => 'Next-Gen Cloud Systems & Distributed Resilience Conf',
                'summary' => 'Architecting fail-safe multi-region Kubernetes clusters, database replication, and edge routing.',
                'description' => "Join 150 top infrastructure and platform engineers for a deep dive into distributed fault tolerance.\n\n### Key Topics\n- Multi-Region Active-Active Postgres\n- Zero-Downtime Migration Strategies\n- OpenTelemetry Observability at Scale",
                'cover_image' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
                'event_type' => Event::TYPE_IN_PERSON,
                'venue_name' => 'Metropolitan Pavilion',
                'venue_address' => '125 W 18th St',
                'venue_city' => 'New York, NY',
                'starts_at' => now()->addDays(28)->setHour(10)->setMinute(0),
                'ends_at' => now()->addDays(28)->setHour(17)->setMinute(0),
                'registration_deadline' => now()->addDays(27),
                'capacity' => 150,
                'registered_count' => 1,
                'status' => Event::STATUS_PUBLISHED,
                'is_featured' => true,
                'ai_summary' => 'Specialized infrastructure conference in NYC covering multi-region database resilience and Kubernetes platform engineering.',
            ]
        );

        $event3 = Event::updateOrCreate(
            ['slug' => 'react-19-reactive-spa-masterclass'],
            [
                'organizer_id' => $organizer1->id,
                'category_id' => $categoryModels['web-and-react']->id,
                'title' => 'Mastering React 19 & Inertia: Full-Stack Reactive Architecture',
                'summary' => 'Learn how to build high-speed reactive web applications combining server-side routing with client-side SPAs.',
                'description' => "A fast-paced virtual masterclass demonstrating how modern monoliths replace microservice bloat.\n\n### Agenda\n- Actions, Forms and Optimistic UI in React 19\n- Type-Safe Route Generators\n- Radix Primitives and Tailwind v4 CSS Tokens",
                'cover_image' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
                'event_type' => Event::TYPE_VIRTUAL,
                'virtual_meeting_url' => 'https://meetmind.ai/webinar/react-19-masterclass',
                'starts_at' => now()->addDays(7)->setHour(14)->setMinute(0),
                'ends_at' => now()->addDays(7)->setHour(17)->setMinute(0),
                'registration_deadline' => now()->addDays(6),
                'capacity' => 100,
                'registered_count' => 2,
                'status' => Event::STATUS_PUBLISHED,
                'is_featured' => false,
                'ai_summary' => 'Three-hour virtual workshop on building reactive monolithic SPAs with React 19, TypeScript, and Inertia.',
            ]
        );

        // 4. Seed Registrations, Tickets and Check-ins
        // Attendee 1 (Alex Rivera) on Event 1
        $reg1 = Registration::updateOrCreate(
            ['event_id' => $event1->id, 'user_id' => $attendee1->id],
            ['status' => Registration::STATUS_CONFIRMED]
        );
        $ticket1 = Ticket::updateOrCreate(
            ['registration_id' => $reg1->id],
            [
                'ticket_code' => 'MM-2026-9041',
                'qr_token' => hash_hmac('sha256', "ticket:{$reg1->id}:event:{$event1->id}:".now()->timestamp, config('app.key')),
                'status' => Ticket::STATUS_USED,
                'checked_in_at' => now()->subHours(2),
            ]
        );
        CheckIn::updateOrCreate(
            ['ticket_id' => $ticket1->id],
            [
                'event_id' => $event1->id,
                'checked_in_by' => $organizer1->id,
                'checked_in_at' => now()->subHours(2),
                'method' => CheckIn::METHOD_QR_SCAN,
                'device_info' => 'Safari / iOS Scanner Terminal #1',
                'notes' => 'VIP Attendee verified at main entrance',
            ]
        );

        // Attendee 2 (Priya Patel) on Event 1
        $reg2 = Registration::updateOrCreate(
            ['event_id' => $event1->id, 'user_id' => $attendee2->id],
            ['status' => Registration::STATUS_CONFIRMED]
        );
        $ticket2 = Ticket::updateOrCreate(
            ['registration_id' => $reg2->id],
            [
                'ticket_code' => 'MM-2026-3819',
                'qr_token' => hash_hmac('sha256', "ticket:{$reg2->id}:event:{$event1->id}:".now()->timestamp, config('app.key')),
                'status' => Ticket::STATUS_VALID,
                'checked_in_at' => null,
            ]
        );

        // Attendee 3 (David Kim) on Event 1
        $reg3 = Registration::updateOrCreate(
            ['event_id' => $event1->id, 'user_id' => $attendee3->id],
            ['status' => Registration::STATUS_CONFIRMED]
        );
        $ticket3 = Ticket::updateOrCreate(
            ['registration_id' => $reg3->id],
            [
                'ticket_code' => 'MM-2026-7265',
                'qr_token' => hash_hmac('sha256', "ticket:{$reg3->id}:event:{$event1->id}:".now()->timestamp, config('app.key')),
                'status' => Ticket::STATUS_VALID,
                'checked_in_at' => null,
            ]
        );

        // Attendee 1 on Event 3
        $reg4 = Registration::updateOrCreate(
            ['event_id' => $event3->id, 'user_id' => $attendee1->id],
            ['status' => Registration::STATUS_CONFIRMED]
        );
        Ticket::updateOrCreate(
            ['registration_id' => $reg4->id],
            [
                'ticket_code' => 'MM-2026-5512',
                'qr_token' => hash_hmac('sha256', "ticket:{$reg4->id}:event:{$event3->id}:".now()->timestamp, config('app.key')),
                'status' => Ticket::STATUS_VALID,
                'checked_in_at' => null,
            ]
        );

        // 5. Seed Feedback & AI Insights
        Feedback::updateOrCreate(
            ['event_id' => $event1->id, 'user_id' => $attendee1->id],
            [
                'rating' => 5,
                'review_text' => 'Outstanding keynotes and practical code demos! The section on multi-agent safety gave our team actionable solutions.',
                'sentiment' => 'positive',
                'sentiment_score' => 0.95,
                'highlights' => ['Practical multi-agent demos', 'High signal-to-noise ratio', 'Flawless venue staging'],
            ]
        );

        Feedback::updateOrCreate(
            ['event_id' => $event1->id, 'user_id' => $attendee2->id],
            [
                'rating' => 5,
                'review_text' => 'Best AI conference I attended this year. The speaker lineup was world-class and networking was incredibly high value.',
                'sentiment' => 'positive',
                'sentiment_score' => 0.98,
                'highlights' => ['World-class speakers', 'High-value networking'],
            ]
        );

        AiEventInsight::updateOrCreate(
            ['event_id' => $event1->id, 'insight_type' => AiEventInsight::TYPE_FEEDBACK_SUMMARY],
            [
                'summary' => 'Attendees expressed overwhelmingly positive sentiment (100% 5-star ratings). The technical depth of multi-agent orchestration and production safety demos were highlighted as the standout value drivers.',
                'sentiment_breakdown' => [
                    'positive' => 100,
                    'neutral' => 0,
                    'negative' => 0,
                    'average_rating' => 5.0,
                ],
                'key_themes' => [
                    'Multi-agent systems architecture',
                    'Enterprise safety and sandboxing',
                    'High attendee networking caliber',
                ],
                'action_items' => [
                    'Consider offering advanced breakout lab sessions for multi-agent debugging in future editions.',
                    'Provide slide decks and GitHub repo links to all attendees immediately post-keynote.',
                ],
            ]
        );
    }
}

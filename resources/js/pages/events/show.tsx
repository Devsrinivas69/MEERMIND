import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    MapPin,
    Video,
    Users,
    Sparkles,
    Ticket,
    CheckCircle2,
    Share2,
    ArrowLeft,
    Building2,
    Bot,
    ChevronDown,
    ChevronUp,
    ShieldCheck
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auth, Event, Ticket as TicketType } from '@/types';

type Props = {
    event: Event;
    isRegistered: boolean;
    userTicket: TicketType | null;
    relatedEvents: Event[];
};

export default function EventShow({ event, isRegistered, userTicket, relatedEvents }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const [registering, setRegistering] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const spotsLeft = Math.max(0, event.capacity - event.registered_count);
    const isSoldOut = spotsLeft === 0;
    const fillPercentage = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const handleRegister = () => {
        if (!user) {
            router.get('/login');
            return;
        }

        setRegistering(true);
        router.post(`/events/${event.slug}/register`, {}, {
            preserveScroll: true,
            onFinish: () => setRegistering(false),
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
            <Head title={`${event.title} — MeetMind AI`} />
            <PublicHeader />

            {/* Breadcrumb Nav */}
            <div className="border-b border-border/40 bg-card/20">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
                    <Link
                        href="/events"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Events
                    </Link>
                </div>
            </div>

            <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
                {/* Event Header Banner */}
                <div className="relative rounded-3xl border border-border/60 overflow-hidden bg-card mb-10 shadow-xl">
                    <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-muted">
                        {event.cover_image ? (
                            <img
                                src={event.cover_image}
                                alt={event.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 flex items-center justify-center">
                                <Calendar className="h-20 w-20 text-muted-foreground/20" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                    </div>

                    <div className="p-6 sm:p-10 -mt-16 sm:-mt-24 relative z-10">
                        <div className="flex flex-wrap items-center gap-2.5 mb-4">
                            {event.category && (
                                <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    {event.category.name}
                                </span>
                            )}
                            <span className="px-3 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground capitalize">
                                {event.event_type}
                            </span>
                            {event.is_featured && (
                                <span className="px-3 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> Featured
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-serif max-w-4xl leading-tight">
                            {event.title}
                        </h1>

                        {event.summary && (
                            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
                                {event.summary}
                            </p>
                        )}

                        {/* Organizer pill */}
                        {event.organizer && (
                            <div className="mt-6 flex items-center gap-3 pt-6 border-t border-border/40">
                                <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-semibold text-sm">
                                    {event.organizer.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Hosted by</div>
                                    <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                        {event.organizer.name}
                                        {event.organizer.company && (
                                            <span className="text-xs text-muted-foreground font-normal">
                                                • {event.organizer.company}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Event Details & Agenda */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Description */}
                        <section className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-foreground mb-4">About This Event</h2>
                            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                {event.description}
                            </div>
                        </section>

                        {/* FAQs */}
                        {event.ai_faqs && event.ai_faqs.length > 0 && (
                            <section className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
                                <div className="flex items-center gap-2 mb-6">
                                    <Bot className="h-5 w-5 text-amber-400" />
                                    <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
                                </div>
                                <div className="space-y-3">
                                    {event.ai_faqs.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden transition-colors"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-medium text-sm text-foreground hover:text-amber-400"
                                            >
                                                <span>{faq.question}</span>
                                                {openFaq === idx ? (
                                                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                )}
                                            </button>
                                            {openFaq === idx && (
                                                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/20 pt-3">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right: Registration Card */}
                    <div className="space-y-6">
                        <div className="sticky top-20 rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xl">
                            {/* Registration Status Banner */}
                            {isRegistered ? (
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6">
                                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                        <span>You are confirmed for this event!</span>
                                    </div>
                                    <p className="mt-1 text-xs text-emerald-400/80">
                                        Your unique digital ticket with QR code is ready.
                                    </p>
                                    {userTicket && (
                                        <Button asChild size="sm" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                                            <Link href={`/attendee/tickets/${userTicket.ticket_code}`}>
                                                <Ticket className="h-4 w-4 mr-2" />
                                                View Digital QR Ticket
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            ) : null}

                            {/* Capacity Meter */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                                    <span>Registration Capacity</span>
                                    <span className="font-mono text-foreground font-semibold">
                                        {event.registered_count} / {event.capacity} Filled
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                                        style={{ width: `${fillPercentage}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-amber-400 font-medium">{spotsLeft} spots remaining</span>
                                    <span className="text-muted-foreground">{100 - fillPercentage}% available</span>
                                </div>
                            </div>

                            {/* Date & Time details */}
                            <div className="space-y-4 py-4 border-y border-border/40 text-sm">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-foreground">{formatDate(event.starts_at)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatTime(event.starts_at)} – {formatTime(event.ends_at)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    {event.event_type === 'virtual' ? (
                                        <>
                                            <Video className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="font-semibold text-foreground">Online Stream</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Link sent to registered attendees
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="font-semibold text-foreground">{event.venue_name || 'Location Announced Soon'}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {event.venue_address ? `${event.venue_address}, ${event.venue_city}` : 'Check back for exact venue'}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Registration Button */}
                            <div className="mt-6">
                                {isRegistered ? (
                                    <Button asChild variant="outline" className="w-full border-border/60">
                                        <Link href="/attendee/tickets">
                                            Manage All My Registrations
                                        </Link>
                                    </Button>
                                ) : isSoldOut ? (
                                    <Button disabled className="w-full bg-muted text-muted-foreground cursor-not-allowed">
                                        Event Sold Out
                                    </Button>
                                ) : user ? (
                                    <Button
                                        onClick={handleRegister}
                                        disabled={registering}
                                        className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-base shadow-lg shadow-amber-500/20"
                                    >
                                        {registering ? 'Registering...' : 'Register for Event (Free)'}
                                    </Button>
                                ) : (
                                    <Button asChild className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-base shadow-lg shadow-amber-500/20">
                                        <Link href="/login">
                                            Sign in to Register
                                        </Link>
                                    </Button>
                                )}
                            </div>

                            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                <span>Instant digital ticket with secure QR check-in</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

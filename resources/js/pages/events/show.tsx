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
    ShieldCheck,
    Hourglass,
    XCircle,
    AlertCircle,
    Send,
    Loader2
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { AiEventAssistant } from '@/components/ai-event-assistant';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Auth, Event, Registration, Ticket as TicketType } from '@/types';

type Props = {
    event: Event;
    userRegistration?: Registration | null;
    isRegistered: boolean;
    isPending?: boolean;
    isWaitlisted?: boolean;
    isRejected?: boolean;
    userTicket: TicketType | null;
    relatedEvents: Event[];
};

export default function EventShow({
    event,
    userRegistration,
    isRegistered,
    isPending = false,
    isWaitlisted = false,
    isRejected = false,
    userTicket,
    relatedEvents,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const [openApplyModal, setOpenApplyModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [applicationNotes, setApplicationNotes] = useState('');
    const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
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

    const handleOpenApply = () => {
        if (!user) {
            router.get('/login');
            return;
        }
        setOpenApplyModal(true);
    };

    const handleSubmitApplication = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(`/events/${event.slug}/register`, {
            notes: applicationNotes,
            answers: customAnswers,
        }, {
            preserveScroll: true,
            onSuccess: () => setOpenApplyModal(false),
            onFinish: () => setSubmitting(false),
        });
    };

    const handleCancelApplication = () => {
        if (!userRegistration || cancelling) return;
        if (!confirm('Are you sure you want to cancel your registration request?')) return;

        setCancelling(true);
        router.post(`/registrations/${userRegistration.id}/cancel`, {}, {
            preserveScroll: true,
            onFinish: () => setCancelling(false),
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
                            <span className="px-3 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                                <Hourglass className="h-3 w-3" /> Requires Approval
                            </span>
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
                    {/* Left 2 Columns: Description & Details */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* About section */}
                        <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-foreground mb-4">About This Event</h2>
                            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                {event.description}
                            </div>
                        </div>

                        {/* FAQs Section */}
                        {event.ai_faqs && event.ai_faqs.length > 0 && (
                            <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <Sparkles className="h-5 w-5 text-amber-400" />
                                    <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
                                </div>
                                <div className="space-y-3">
                                    {event.ai_faqs.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-2xl border border-border/40 bg-background/50 overflow-hidden"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                                            >
                                                <span className="font-semibold text-sm text-foreground">{faq.question}</span>
                                                {openFaq === idx ? (
                                                    <ChevronUp className="h-4 w-4 text-amber-400 shrink-0" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                )}
                                            </button>
                                            {openFaq === idx && (
                                                <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground border-t border-border/20">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Registration Card & Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl sticky top-24">
                            <div className="flex items-center justify-between pb-4 border-b border-border/40">
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Admission</div>
                                    <div className="text-2xl font-extrabold text-foreground">Free Registration</div>
                                </div>
                                <Badge variant="outline" className="text-xs border-amber-500/40 bg-amber-500/10 text-amber-400">
                                    Application Review
                                </Badge>
                            </div>

                            {/* Capacity meter */}
                            <div className="mt-5 space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Approved Attendees</span>
                                    <span className="font-semibold text-foreground">
                                        {event.registered_count} / {event.capacity} seats reserved
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-amber-500 h-2 rounded-full transition-all"
                                        style={{ width: `${fillPercentage}%` }}
                                    />
                                </div>
                                <div className="text-[11px] text-muted-foreground text-right">
                                    {spotsLeft > 0 ? `${spotsLeft} seats remaining` : 'Capacity reached'}
                                </div>
                            </div>

                            {/* Schedule & Location */}
                            <div className="mt-6 space-y-4 pt-6 border-t border-border/40 text-sm">
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
                                                <div className="font-semibold text-foreground">Virtual Live Stream</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Link sent to approved attendees
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

                            {/* Dynamic Registration & Approval Status Area */}
                            <div className="mt-6 pt-6 border-t border-border/40">
                                {isRegistered && userTicket ? (
                                    /* 1. APPROVED STATUS */
                                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span>Registration Approved!</span>
                                        </div>
                                        <p className="text-xs text-foreground/80">
                                            Congratulations! Your application has been approved by the organizer. Your unique digital QR boarding pass is ready.
                                        </p>
                                        <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold">
                                            <Link href={`/attendee/tickets/${userTicket.ticket_code}`}>
                                                <Ticket className="h-4 w-4 mr-2" />
                                                View Digital QR Boarding Pass
                                            </Link>
                                        </Button>
                                    </div>
                                ) : isPending ? (
                                    /* 2. PENDING STATUS */
                                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                                            <Hourglass className="h-5 w-5 animate-pulse" />
                                            <span>Application Pending Review</span>
                                        </div>
                                        <p className="text-xs text-foreground/80 leading-relaxed">
                                            Your registration request has been submitted. Waiting for organizer approval. You will receive an email once reviewed.
                                        </p>
                                        <Button
                                            onClick={handleCancelApplication}
                                            disabled={cancelling}
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-border/60 text-xs text-muted-foreground hover:text-rose-400"
                                        >
                                            {cancelling ? 'Cancelling...' : 'Cancel Application'}
                                        </Button>
                                    </div>
                                ) : isWaitlisted ? (
                                    /* 3. WAITLISTED STATUS */
                                    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                                            <Users className="h-5 w-5" />
                                            <span>Placed on Event Waitlist</span>
                                        </div>
                                        <p className="text-xs text-foreground/80 leading-relaxed">
                                            You are currently on the waitlist. If spots become available, waitlisted applicants are promoted in sequence.
                                        </p>
                                    </div>
                                ) : isRejected ? (
                                    /* 4. REJECTED STATUS */
                                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                                            <XCircle className="h-5 w-5" />
                                            <span>Application Not Approved</span>
                                        </div>
                                        <p className="text-xs text-foreground/80 leading-relaxed">
                                            Your application was not approved for this session due to limited capacity or criteria matching.
                                        </p>
                                        {userRegistration?.rejection_reason && (
                                            <div className="text-xs italic text-rose-300/90 bg-rose-950/30 p-2 rounded-lg border border-rose-500/20">
                                                "{userRegistration.rejection_reason}"
                                            </div>
                                        )}
                                    </div>
                                ) : isSoldOut ? (
                                    /* 5. SOLD OUT / WAITLIST APPLY */
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleOpenApply}
                                            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                        >
                                            Apply for Waitlist
                                        </Button>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Event is at capacity. Submit an application to join the priority waitlist.
                                        </p>
                                    </div>
                                ) : user ? (
                                    /* 6. READY TO APPLY */
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleOpenApply}
                                            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-base shadow-lg shadow-amber-500/20"
                                        >
                                            Apply to Attend (Requires Approval)
                                        </Button>
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
                                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                            <span>Organizer approval required before ticket issuance</span>
                                        </div>
                                    </div>
                                ) : (
                                    /* 7. GUEST USER */
                                    <Button asChild className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-base shadow-lg shadow-amber-500/20">
                                        <Link href="/login">
                                            Sign in to Apply
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Application Submission Dialog */}
            <Dialog open={openApplyModal} onOpenChange={setOpenApplyModal}>
                <DialogContent className="sm:max-w-xl bg-card border-border/80">
                    <DialogHeader>
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            Attendee Application
                        </div>
                        <DialogTitle className="text-xl font-bold text-foreground">
                            Apply for {event.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            This event curates attendee attendance to maintain high signal. Please complete the application details below for organizer review.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitApplication} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-xl border border-border/40">
                            <div>
                                <span className="text-muted-foreground">Applicant Name:</span>
                                <div className="font-semibold text-foreground">{user?.name}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Email:</span>
                                <div className="font-semibold text-foreground">{user?.email}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                Motivation / Why do you wish to attend?
                            </label>
                            <textarea
                                value={applicationNotes}
                                onChange={(e) => setApplicationNotes(e.target.value)}
                                placeholder="Describe your relevant background, technical interests, or what you hope to contribute/learn..."
                                rows={3}
                                className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 resize-none"
                            />
                        </div>

                        {/* Custom Questions Defined by Organizer */}
                        {event.custom_questions && event.custom_questions.map((q) => (
                            <div key={q.id}>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                    {q.label} {q.required && <span className="text-amber-400">*</span>}
                                </label>
                                <input
                                    type={q.type || 'text'}
                                    required={q.required}
                                    value={customAnswers[q.id] || ''}
                                    onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                                    placeholder="Your answer..."
                                    className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                                />
                            </div>
                        ))}

                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                                Submitting creates a **PENDING** request. Tickets are generated only upon approval by the organizer committee.
                            </span>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpenApplyModal(false)}
                                className="border-border/60"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting Request...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Registration Application
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* AI Grounded Event Assistant */}
            <AiEventAssistant event={event} />
        </div>
    );
}

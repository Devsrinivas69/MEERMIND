import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    MapPin,
    ArrowLeft,
    Printer,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Sparkles,
    Building2,
    Video,
    Star,
    MessageSquare,
    Send,
    Loader2
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { Button } from '@/components/ui/button';
import type { Feedback, Ticket } from '@/types';

type Props = {
    ticket: Ticket;
    qrSvg: string;
    existingFeedback?: Feedback | null;
};

export default function TicketShow({ ticket, qrSvg, existingFeedback }: Props) {
    const registration = ticket.registration;
    const event = registration?.event;
    const attendee = registration?.user;
    const isCheckedIn = ticket.status === 'used';
    const isCancelled = ticket.status === 'cancelled';

    const [rating, setRating] = useState(existingFeedback?.rating || 5);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState(existingFeedback?.review_text || '');
    const [submitting, setSubmitting] = useState(false);
    const [feedbackDone, setFeedbackDone] = useState(!!existingFeedback);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const handlePrint = () => {
        window.print();
    };

    if (!event || !attendee) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/20 selection:text-amber-300 print:bg-white print:text-black">
            <Head title={`Ticket ${ticket.ticket_code} — MeetMind AI`} />

            <div className="print:hidden">
                <PublicHeader />
                <div className="border-b border-border/40 bg-card/20">
                    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-3 flex items-center justify-between">
                        <Link
                            href="/attendee/tickets"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to My Tickets
                        </Link>

                        <Button onClick={handlePrint} size="sm" variant="outline" className="border-border/60">
                            <Printer className="h-4 w-4 mr-2" />
                            Print / Save PDF
                        </Button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center">
                {/* Boarding Pass Style Digital Ticket Card */}
                <div className="w-full rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden print:border-neutral-300 print:shadow-none print:rounded-none">
                    {/* Top Branding Bar */}
                    <div className="bg-neutral-900 border-b border-border/60 px-6 sm:px-8 py-5 flex items-center justify-between print:bg-neutral-100 print:border-neutral-300">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-foreground tracking-tight text-base print:text-neutral-900">
                                MeetMind <span className="text-amber-400 font-mono text-xs">PASS</span>
                            </span>
                        </div>

                        <div className="text-right">
                            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Pass Code</div>
                            <div className="font-mono font-bold text-sm sm:text-base text-amber-400 tracking-wider print:text-neutral-900">
                                {ticket.ticket_code}
                            </div>
                        </div>
                    </div>

                    {/* Event & Attendee Details */}
                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Event Title */}
                        <div>
                            {event.category && (
                                <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-2">
                                    {event.category.name}
                                </span>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif leading-tight print:text-neutral-900">
                                {event.title}
                            </h1>
                        </div>

                        {/* Attendee Row */}
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40 print:bg-neutral-50 print:border-neutral-200">
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Attendee Name</div>
                                <div className="text-sm sm:text-base font-semibold text-foreground mt-0.5 print:text-neutral-900">
                                    {attendee.name}
                                </div>
                                {attendee.company && (
                                    <div className="text-xs text-muted-foreground mt-0.5">{attendee.company}</div>
                                )}
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Registered Email</div>
                                <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5 truncate print:text-neutral-900">
                                    {attendee.email}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                                    Access: General Admission
                                </div>
                            </div>
                        </div>

                        {/* Schedule & Venue Coordinates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-foreground print:text-neutral-900">
                                        {formatDate(event.starts_at)}
                                    </div>
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
                                            <div className="font-semibold text-foreground print:text-neutral-900">Online Stream</div>
                                            <div className="text-xs text-muted-foreground">Virtual access link</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <div className="font-semibold text-foreground print:text-neutral-900">
                                                {event.venue_name || 'In-Person Venue'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {event.venue_address ? `${event.venue_address}, ${event.venue_city}` : event.venue_city}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tear-off divider */}
                    <div className="relative py-2 flex items-center">
                        <div className="absolute left-0 -ml-4 h-8 w-8 rounded-full bg-background border-r border-border/80 print:hidden" />
                        <div className="w-full border-t-2 border-dashed border-border/80 print:border-neutral-400" />
                        <div className="absolute right-0 -mr-4 h-8 w-8 rounded-full bg-background border-l border-border/80 print:hidden" />
                    </div>

                    {/* QR Code Section */}
                    <div className="p-6 sm:p-8 bg-card flex flex-col items-center text-center">
                        {/* Status Alert */}
                        {isCheckedIn ? (
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Checked In • Ticket Verified</span>
                            </div>
                        ) : isCancelled ? (
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-1.5 text-xs font-semibold text-red-400">
                                <XCircle className="h-4 w-4" />
                                <span>Ticket Cancelled / Revoked</span>
                            </div>
                        ) : (
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-xs font-semibold text-amber-400">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Ready for Entrance Check-In</span>
                            </div>
                        )}

                        {/* SVG QR Code Display */}
                        <div className="p-4 rounded-2xl bg-white border border-border/40 shadow-inner my-2 inline-block">
                            <div
                                className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                                dangerouslySetInnerHTML={{ __html: qrSvg }}
                            />
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground max-w-sm">
                            Present this QR code on your mobile screen or on paper at the registration counter for rapid scanner validation.
                        </p>

                        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Cryptographically Signed HMAC-SHA256 Token</span>
                        </div>
                    </div>
                </div>

                {/* Attendee Verified Feedback Form (print:hidden) */}
                <div className="w-full mt-8 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl print:hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <h3 className="text-base font-bold text-foreground">Event Feedback & Review</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">Verified Attendee Review</span>
                    </div>

                    {feedbackDone ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                            <h4 className="text-sm font-bold text-foreground">Thank you for your feedback!</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                                Your ratings and review have been analyzed by MeetMind AI to help the organizer improve future sessions.
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 ${
                                            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'
                                        }`}
                                    />
                                ))}
                            </div>
                            {reviewText && (
                                <p className="mt-3 text-xs italic text-foreground/80 max-w-lg mx-auto">
                                    "{reviewText}"
                                </p>
                            )}
                        </div>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!reviewText.trim() || submitting) return;
                                setSubmitting(true);
                                router.post(`/events/${event.id}/feedback`, {
                                    rating,
                                    review_text: reviewText,
                                }, {
                                    preserveScroll: true,
                                    onSuccess: () => setFeedbackDone(true),
                                    onFinish: () => setSubmitting(false),
                                });
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Your Rating
                                </label>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="p-1 rounded-lg hover:bg-muted/60 transition-colors focus:outline-none"
                                        >
                                            <Star
                                                className={`h-7 w-7 transition-colors ${
                                                    star <= (hoverRating || rating)
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : 'text-muted-foreground/30'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                    <span className="text-xs font-medium text-muted-foreground ml-2">
                                        {rating === 5 ? 'Exceptional' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : 'Needs Improvement'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Your Honest Review
                                </label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="What did you think of the speakers, technical content, organization, or venue?"
                                    rows={3}
                                    required
                                    minLength={5}
                                    maxLength={2000}
                                    className="w-full rounded-2xl border border-input bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting || reviewText.trim().length < 5}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting Feedback...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Verified Review
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}

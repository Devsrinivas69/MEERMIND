import { Head, Link } from '@inertiajs/react';
import {
    Sparkles,
    ArrowLeft,
    Star,
    Smile,
    Meh,
    Frown,
    MessageSquare,
    TrendingUp,
    CheckCircle2,
    Lightbulb,
    Calendar,
    Users,
    Tag
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem, Event, Feedback, AiEventInsight } from '@/types';

type PaginatedFeedbacks = {
    data: Feedback[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    event: Event;
    feedbacks: PaginatedFeedbacks;
    insight: AiEventInsight | null;
};

export default function EventFeedbackReport({ event, feedbacks, insight }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Organizer Dashboard', href: '/organizer/dashboard' },
        { title: 'My Events', href: '/organizer/events' },
        { title: event.title, href: `/events/${event.slug}` },
        { title: 'AI Feedback Intelligence', href: `/organizer/events/${event.id}/feedback` },
    ];

    const breakdown = insight?.sentiment_breakdown || {
        positive: 0,
        neutral: 0,
        negative: 0,
        average_rating: 0,
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${
                            star <= rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-muted-foreground/30'
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`AI Feedback Intelligence — ${event.title}`} />

            <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link
                                href="/organizer/events"
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Events
                            </Link>
                            <span className="text-muted-foreground/40">•</span>
                            <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Intelligence Active
                            </Badge>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                            Attendee Feedback & AI Intelligence
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{event.title}</span>
                            <span>•</span>
                            <span className="capitalize">{event.event_type}</span>
                            <span>•</span>
                            <span>{feedbacks.total} Verified Responses</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="sm" className="border-border/60">
                            <Link href={`/organizer/events/${event.id}/check-in`}>
                                Live Check-In Terminal
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold">
                            <Link href={`/events/${event.slug}`}>
                                View Public Event
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* AI Executive Summary Banner */}
                {insight ? (
                    <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-950/15 p-6 sm:p-8 shadow-xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Sparkles className="h-44 w-44 text-amber-400" />
                        </div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
                                <Sparkles className="h-3.5 w-3.5" />
                                Executive AI Synthesis
                            </div>

                            <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed max-w-4xl mb-6">
                                {insight.summary}
                            </p>

                            {/* Recurring Themes & Action Items Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/40">
                                {/* Recurring Themes */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                                        <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                                        Key Recurring Themes
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {insight.key_themes && insight.key_themes.length > 0 ? (
                                            insight.key_themes.map((theme, idx) => (
                                                <div
                                                    key={idx}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/60 text-xs font-medium text-foreground"
                                                >
                                                    <Tag className="h-3 w-3 text-amber-400" />
                                                    <span>{theme}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Gathering more feedback to isolate distinct themes.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actionable Recommendations */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                                        <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                                        Actionable Recommendations
                                    </h4>
                                    <ul className="space-y-2">
                                        {insight.action_items && insight.action_items.length > 0 ? (
                                            insight.action_items.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-xs text-muted-foreground">No critical action items identified yet.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
                        <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-foreground">Awaiting Attendee Reviews</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
                            MeetMind AI synthesizes sentiment, highlights, and actionable takeaways as soon as attendees begin submitting event reviews.
                        </p>
                    </div>
                )}

                {/* Sentiment & KPI Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Overall Rating */}
                    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Average Satisfaction
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-foreground">
                                {breakdown.average_rating > 0 ? breakdown.average_rating : '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">/ 5.0</span>
                        </div>
                        <div className="mt-2">
                            {renderStars(Math.round(breakdown.average_rating || 0))}
                        </div>
                    </div>

                    {/* Positive Sentiment */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
                        <div className="flex items-center justify-between text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">
                            <span>Positive Sentiment</span>
                            <Smile className="h-4 w-4" />
                        </div>
                        <div className="text-3xl font-extrabold text-foreground">
                            {breakdown.positive}%
                        </div>
                        <div className="w-full bg-emerald-950/40 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div
                                className="bg-emerald-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${breakdown.positive}%` }}
                            />
                        </div>
                    </div>

                    {/* Neutral Sentiment */}
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm">
                        <div className="flex items-center justify-between text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">
                            <span>Neutral Sentiment</span>
                            <Meh className="h-4 w-4" />
                        </div>
                        <div className="text-3xl font-extrabold text-foreground">
                            {breakdown.neutral}%
                        </div>
                        <div className="w-full bg-amber-950/40 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div
                                className="bg-amber-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${breakdown.neutral}%` }}
                            />
                        </div>
                    </div>

                    {/* Negative Sentiment */}
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 shadow-sm">
                        <div className="flex items-center justify-between text-xs font-medium text-rose-400 uppercase tracking-wider mb-2">
                            <span>Negative Sentiment</span>
                            <Frown className="h-4 w-4" />
                        </div>
                        <div className="text-3xl font-extrabold text-foreground">
                            {breakdown.negative}%
                        </div>
                        <div className="w-full bg-rose-950/40 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div
                                className="bg-rose-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${breakdown.negative}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Attendee Reviews Feed */}
                <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-amber-400" />
                            <h3 className="text-base font-bold text-foreground">Verified Attendee Reviews</h3>
                            <Badge variant="secondary" className="text-xs">
                                {feedbacks.total}
                            </Badge>
                        </div>
                    </div>

                    {feedbacks.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm font-medium text-foreground">No reviews submitted yet</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                Once attendees check in and complete the event, their verified reviews and ratings will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {feedbacks.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 sm:p-5 rounded-2xl border border-border/40 bg-background/50 hover:border-border transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                                                {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'A'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-foreground">
                                                    {item.user?.name || 'Verified Attendee'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.user?.job_title ? `${item.user.job_title} · ` : ''}
                                                    {item.user?.company || 'Attendee'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {renderStars(item.rating)}
                                            {item.sentiment && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs capitalize ${
                                                        item.sentiment === 'positive'
                                                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                                            : item.sentiment === 'neutral'
                                                            ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                                                            : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
                                                    }`}
                                                >
                                                    {item.sentiment}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm text-foreground/90 leading-relaxed">
                                        "{item.review_text}"
                                    </p>

                                    <div className="mt-3 text-xs text-muted-foreground/70">
                                        Submitted {new Date(item.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

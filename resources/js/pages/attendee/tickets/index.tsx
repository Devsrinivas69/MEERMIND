import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Ticket,
    CheckCircle2,
    XCircle,
    Hourglass,
    MapPin,
    ArrowRight,
    QrCode,
    Sparkles,
    AlertCircle,
    Clock,
    Users
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem, Registration } from '@/types';

type PaginationData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    registrations: PaginationData<Registration>;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendee Hub',
        href: '/attendee/tickets',
    },
    {
        title: 'My Passes & Applications',
        href: '/attendee/tickets',
    },
];

export default function AttendeeTicketsIndex({ registrations }: Props) {
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'waitlisted'>('all');

    const handleCancel = (registrationId: number, eventTitle: string) => {
        if (confirm(`Are you sure you want to cancel your application/registration for "${eventTitle}"?`)) {
            setCancellingId(registrationId);
            router.post(`/registrations/${registrationId}/cancel`, {}, {
                preserveScroll: true,
                onFinish: () => setCancellingId(null),
            });
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
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

    const filteredRegistrations = registrations.data.filter((reg) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'approved') return reg.status === 'approved' || reg.status === 'confirmed';
        if (activeTab === 'pending') return reg.status === 'pending';
        if (activeTab === 'waitlisted') return reg.status === 'waitlisted';
        return true;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Passes & Applications — MeetMind AI" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                            My Passes & Applications
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track the review status of your applications, access approved QR entry passes, and manage event attendance.
                        </p>
                    </div>

                    <Button asChild variant="outline" className="border-border/60 hover:border-amber-500/50">
                        <Link href="/events" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span>Browse Events</span>
                        </Link>
                    </Button>
                </div>

                {/* Filter Tabs */}
                {registrations.data.length > 0 && (
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2 overflow-x-auto">
                        {[
                            { key: 'all', label: 'All Requests' },
                            { key: 'approved', label: 'Approved Tickets' },
                            { key: 'pending', label: 'Pending Review' },
                            { key: 'waitlisted', label: 'Waitlist' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-amber-500 text-neutral-950 shadow-sm'
                                        : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Tickets & Applications List */}
                {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-border/60 bg-card/40 p-10">
                        <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                            <Ticket className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No applications in this view</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                            Explore upcoming technical conferences, workshops, and roundtables and submit your attendance request.
                        </p>
                        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold">
                            <Link href="/events">
                                Explore Published Events
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredRegistrations.map((reg) => {
                            const event = reg.event;
                            const ticket = reg.ticket;
                            const isApproved = reg.status === 'approved' || reg.status === 'confirmed';
                            const isPending = reg.status === 'pending';
                            const isWaitlisted = reg.status === 'waitlisted';
                            const isRejected = reg.status === 'rejected';
                            const isCancelled = reg.status === 'cancelled';
                            const isCheckedIn = ticket?.status === 'used';

                            if (!event) return null;

                            return (
                                <div
                                    key={reg.id}
                                    className={`relative flex flex-col rounded-2xl border overflow-hidden bg-card transition-all duration-300 ${
                                        isCancelled || isRejected
                                            ? 'opacity-65 border-border/30 bg-muted/20'
                                            : isApproved
                                            ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-sm'
                                            : isPending
                                            ? 'border-amber-500/30 hover:border-amber-500/50 shadow-sm'
                                            : 'border-border/60'
                                    }`}
                                >
                                    {/* Event Cover / Fallback */}
                                    <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
                                        {event.cover_image ? (
                                            <img
                                                src={event.cover_image}
                                                alt={event.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-r from-neutral-900 to-neutral-800 flex items-center justify-center">
                                                <Calendar className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            {isApproved ? (
                                                isCheckedIn ? (
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Checked In
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Approved • Ready
                                                    </span>
                                                )
                                            ) : isPending ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                    <Hourglass className="h-3 w-3 animate-pulse" /> Pending Review
                                                </span>
                                            ) : isWaitlisted ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> Waitlisted
                                                </span>
                                            ) : isRejected ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                                    <XCircle className="h-3 w-3" /> Not Approved
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground">
                                                    Cancelled
                                                </span>
                                            )}
                                        </div>

                                        {event.category && (
                                            <div className="absolute bottom-3 left-4">
                                                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-black/70 text-amber-400 border border-amber-500/30">
                                                    {event.category.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                                                <span>{formatDate(event.starts_at)}</span>
                                                <span>•</span>
                                                <span>{formatTime(event.starts_at)}</span>
                                            </div>

                                            <h3 className="text-lg font-bold text-foreground tracking-tight line-clamp-1">
                                                {event.title}
                                            </h3>

                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {event.event_type === 'virtual' ? 'Virtual Webinar' : event.venue_name || event.venue_city || 'Venue TBA'}
                                                </span>
                                            </div>

                                            {/* Status Details Box */}
                                            {isApproved && ticket && (
                                                <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between font-mono text-xs">
                                                    <span className="text-emerald-400 font-sans font-medium">Digital Pass:</span>
                                                    <span className="font-semibold text-emerald-300 tracking-wider">{ticket.ticket_code}</span>
                                                </div>
                                            )}

                                            {isPending && (
                                                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300/90 leading-relaxed">
                                                    <span className="font-semibold text-amber-400 block mb-0.5">Awaiting Organizer Review</span>
                                                    Your application is with the host committee. You will receive an email notification when reviewed.
                                                </div>
                                            )}

                                            {isWaitlisted && (
                                                <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/25 text-xs text-purple-300/90 leading-relaxed">
                                                    <span className="font-semibold text-purple-400 block mb-0.5">Priority Waitlist</span>
                                                    You are on the event waitlist. We will notify you immediately if additional capacity opens up.
                                                </div>
                                            )}

                                            {isRejected && (
                                                <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300/90 leading-relaxed">
                                                    <span className="font-semibold text-rose-400 block mb-0.5">Application Not Selected</span>
                                                    {reg.rejection_reason ? `"${reg.rejection_reason}"` : 'The host was unable to approve this request.'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                                            {isApproved && ticket ? (
                                                <Button asChild className="flex-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold shadow-sm">
                                                    <Link href={`/attendee/tickets/${ticket.ticket_code}`} className="flex items-center justify-center gap-2">
                                                        <QrCode className="h-4 w-4" />
                                                        <span>View QR Ticket Pass</span>
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button asChild variant="outline" className="flex-1 border-border/60">
                                                    <Link href={`/events/${event.slug}`}>
                                                        View Event Details
                                                    </Link>
                                                </Button>
                                            )}

                                            {!isCancelled && !isRejected && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={cancellingId === reg.id}
                                                    onClick={() => handleCancel(reg.id, event.title)}
                                                    className="text-xs text-muted-foreground hover:text-red-400"
                                                >
                                                    {cancellingId === reg.id ? 'Cancelling...' : 'Cancel'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

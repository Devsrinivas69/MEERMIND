import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Ticket,
    CheckCircle2,
    XCircle,
    MapPin,
    ArrowRight,
    QrCode,
    Sparkles,
    AlertCircle
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
        title: 'My Tickets',
        href: '/attendee/tickets',
    },
];

export default function AttendeeTicketsIndex({ registrations }: Props) {
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const handleCancel = (registrationId: number, eventTitle: string) => {
        if (confirm(`Are you sure you want to cancel your registration for "${eventTitle}"? Your ticket will be revoked and your spot released.`)) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Tickets — MeetMind AI" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                            My Passes & Tickets
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Access your digital entry tickets, QR check-in codes, and registered conference details.
                        </p>
                    </div>

                    <Button asChild variant="outline" className="border-border/60 hover:border-amber-500/50">
                        <Link href="/events" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span>Browse More Events</span>
                        </Link>
                    </Button>
                </div>

                {/* Tickets List */}
                {registrations.data.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-border/60 bg-card/40 p-10">
                        <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                            <Ticket className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No active event tickets</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                            You haven't registered for any events yet. Explore upcoming summits and secure your spot with instant digital ticketing.
                        </p>
                        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold">
                            <Link href="/events">
                                Explore Published Events
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {registrations.data.map((reg) => {
                            const event = reg.event;
                            const ticket = reg.ticket;
                            const isCancelled = reg.status === 'cancelled';
                            const isCheckedIn = ticket?.status === 'used';

                            if (!event) return null;

                            return (
                                <div
                                    key={reg.id}
                                    className={`relative flex flex-col rounded-2xl border overflow-hidden bg-card transition-all duration-300 ${
                                        isCancelled
                                            ? 'opacity-60 border-border/30 bg-muted/20'
                                            : 'border-border/60 hover:border-amber-500/40 shadow-sm'
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
                                            {isCancelled ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                                    <XCircle className="h-3 w-3" /> Cancelled
                                                </span>
                                            ) : isCheckedIn ? (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Checked In
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                    <QrCode className="h-3 w-3" /> Active Pass
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

                                    {/* Ticket Body */}
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

                                            {ticket && (
                                                <div className="mt-4 p-2.5 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between font-mono text-xs">
                                                    <span className="text-muted-foreground">Pass Code:</span>
                                                    <span className="font-semibold text-foreground tracking-wider">{ticket.ticket_code}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                                            {!isCancelled && ticket ? (
                                                <Button asChild className="flex-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold shadow-sm">
                                                    <Link href={`/attendee/tickets/${ticket.ticket_code}`} className="flex items-center justify-center gap-2">
                                                        <QrCode className="h-4 w-4" />
                                                        <span>View QR Ticket</span>
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button asChild variant="outline" className="flex-1 border-border/60">
                                                    <Link href={`/events/${event.slug}`}>
                                                        View Event Details
                                                    </Link>
                                                </Button>
                                            )}

                                            {!isCancelled && (
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

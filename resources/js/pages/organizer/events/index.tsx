import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    PlusCircle,
    Users,
    QrCode,
    ExternalLink,
    Edit3,
    Trash2,
    Eye,
    EyeOff,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem, Event } from '@/types';

type PaginationData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    events: PaginationData<Event & { registrations_count: number; check_ins_count: number }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organizer Studio',
        href: '/organizer/events',
    },
    {
        title: 'Events',
        href: '/organizer/events',
    },
];

export default function OrganizerEventsIndex({ events }: Props) {
    const handleTogglePublish = (event: Event) => {
        router.post(`/organizer/events/${event.id}/toggle-publish`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (event: Event) => {
        if (confirm(`Are you sure you want to archive "${event.title}"?`)) {
            router.delete(`/organizer/events/${event.id}`, {
                preserveScroll: true,
            });
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Events — MeetMind AI" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                            Event Management
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create, publish, and monitor your conferences, workshops, and attendee check-ins.
                        </p>
                    </div>

                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold shadow-sm">
                        <Link href="/organizer/events/create" className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4" />
                            <span>Create Event</span>
                        </Link>
                    </Button>
                </div>

                {/* Event Table / Cards */}
                {events.data.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-border/60 bg-card/40 p-10">
                        <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No events created yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                            Launch your first event with custom capacity, dates, and automatic digital QR ticketing.
                        </p>
                        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-medium">
                            <Link href="/organizer/events/create">
                                Create Your First Event
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border/50 bg-muted/30 text-xs uppercase font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Event Details</th>
                                        <th className="px-6 py-4">Format & Date</th>
                                        <th className="px-6 py-4">Capacity & Registrations</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {events.data.map((event) => {
                                        const regCount = event.registrations_count ?? event.registered_count ?? 0;
                                        const checkInCount = event.check_ins_count ?? 0;
                                        const pctFilled = Math.min(100, Math.round((regCount / event.capacity) * 100));

                                        return (
                                            <tr key={event.id} className="hover:bg-muted/20 transition-colors">
                                                {/* Event Info */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {event.cover_image ? (
                                                            <img
                                                                src={event.cover_image}
                                                                alt=""
                                                                className="h-12 w-16 rounded-lg object-cover shrink-0 border border-border/40"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/40">
                                                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                                                                {event.title}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                                {event.category && (
                                                                    <span className="text-amber-400 font-medium">{event.category.name}</span>
                                                                )}
                                                                <span>•</span>
                                                                <span className="truncate">{event.venue_city || 'Online'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Date & Type */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-foreground">
                                                        {formatDate(event.starts_at)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground capitalize mt-0.5">
                                                        {event.event_type}
                                                    </div>
                                                </td>

                                                {/* Registration & Check-in Stats */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="font-semibold text-foreground font-mono">
                                                            {regCount} / {event.capacity}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({pctFilled}%)
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-500 rounded-full"
                                                            style={{ width: `${pctFilled}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                        <span>{checkInCount} Checked-in</span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                            event.status === 'published'
                                                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                                : 'bg-muted text-muted-foreground border border-border/40'
                                                        }`}
                                                    >
                                                        {event.status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Public Link */}
                                                        {event.status === 'published' && (
                                                            <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                                <Link href={`/events/${event.slug}`} target="_blank" title="View Public Page">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}

                                                        {/* QR Scanner */}
                                                        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" title="Open QR Check-In Scanner">
                                                            <Link href={`/organizer/events/${event.id}/check-in`}>
                                                                <QrCode className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        {/* Registration & Application Review */}
                                                        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" title="Review Attendee Applications">
                                                            <Link href={`/organizer/events/${event.id}/registrations`}>
                                                                <Users className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        {/* Edit */}
                                                        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Edit Event">
                                                            <Link href={`/organizer/events/${event.id}/edit`}>
                                                                <Edit3 className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        {/* Toggle Publish */}
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleTogglePublish(event)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            title={event.status === 'published' ? 'Unpublish to Draft' : 'Publish Event'}
                                                        >
                                                            {event.status === 'published' ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4 text-emerald-400" />
                                                            )}
                                                        </Button>

                                                        {/* Delete */}
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(event)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                                                            title="Archive Event"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

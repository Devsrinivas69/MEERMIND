import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    Users,
    CheckCircle2,
    Ticket,
    TrendingUp,
    PlusCircle,
    ArrowUpRight,
    QrCode,
    Sparkles,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrganizerCopilot } from '@/components/organizer-copilot';
import type { BreadcrumbItem } from '@/types';

type EventPerformance = {
    id: number;
    title: string;
    slug: string;
    status: string;
    starts_at: string;
    capacity: number;
    registrations_count: number;
    check_ins_count: number;
    turnout_rate: number;
    category?: string | null;
};

type RecentReg = {
    id: number;
    attendee_name: string;
    attendee_email: string;
    attendee_company?: string | null;
    event_title: string;
    event_slug: string;
    registered_at: string;
    ticket_code?: string;
    status: string;
    is_checked_in: boolean;
};

type Props = {
    metrics: {
        total_events: number;
        published_events: number;
        total_registrations: number;
        total_check_ins: number;
        total_capacity: number;
        overall_attendance_rate: number;
        capacity_utilization: number;
    };
    eventPerformance: EventPerformance[];
    recentRegistrations: RecentReg[];
    trends: Array<{ day: string; count: number }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organizer Studio',
        href: '/organizer/dashboard',
    },
    {
        title: 'Analytics Overview',
        href: '/organizer/dashboard',
    },
];

export default function OrganizerDashboard({
    metrics,
    eventPerformance,
    recentRegistrations,
    trends,
}: Props) {
    const maxTrendCount = Math.max(1, ...trends.map((t) => t.count));

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizer Analytics — MeetMind AI" />

            <div className="flex h-full flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 mb-2">
                            <Sparkles className="h-3 w-3" />
                            Live Intelligence Engine
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                            Executive Event Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Real-time metrics on attendance velocity, capacity fulfillment, and entrance check-ins.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {eventPerformance && eventPerformance.length > 0 && (
                            <OrganizerCopilot
                                eventId={eventPerformance[0].id}
                                eventTitle={eventPerformance[0].title}
                                capacity={eventPerformance[0].capacity}
                                registeredCount={eventPerformance[0].registrations_count}
                            />
                        )}
                        <Button asChild variant="outline" className="border-border/60">
                            <Link href="/organizer/events">
                                Manage Events
                            </Link>
                        </Button>
                        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold">
                            <Link href="/organizer/events/create" className="flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                <span>Create Event</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Total Registrations */}
                    <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-mono text-muted-foreground">Total Registrations</span>
                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mt-3 font-mono">
                            {metrics.total_registrations}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <span className="text-emerald-400 font-semibold">{metrics.capacity_utilization}%</span> of total venue capacity
                        </div>
                    </div>

                    {/* Total Checked In */}
                    <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-mono text-muted-foreground">Attendees Arrived</span>
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-emerald-400 mt-3 font-mono">
                            {metrics.total_check_ins}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            Verified at scanner terminals
                        </div>
                    </div>

                    {/* Overall Turnout Rate */}
                    <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-mono text-muted-foreground">Turnout Rate</span>
                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-amber-400 mt-3 font-mono">
                            {metrics.overall_attendance_rate}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            Checked in vs. registered
                        </div>
                    </div>

                    {/* Active Events */}
                    <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-mono text-muted-foreground">Active Events</span>
                            <div className="h-8 w-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mt-3 font-mono">
                            {metrics.published_events} <span className="text-sm font-normal text-muted-foreground">/ {metrics.total_events}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            {metrics.total_capacity} total venue capacity
                        </div>
                    </div>
                </div>

                {/* Registration Trends Bar Chart */}
                <div className="p-6 sm:p-8 rounded-2xl border border-border/60 bg-card shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-amber-400" />
                                7-Day Registration Velocity
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Daily new ticket reservations across your published events.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-3 sm:gap-6 items-end h-44 pt-6 border-b border-border/40">
                        {trends.map((item, idx) => {
                            const barHeightPercent = Math.max(10, Math.round((item.count / maxTrendCount) * 100));

                            return (
                                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="text-[11px] font-mono text-amber-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.count}
                                    </div>
                                    <div
                                        className="w-full max-w-[42px] bg-gradient-to-t from-amber-600/70 to-amber-400 rounded-t-lg transition-all duration-500 hover:from-amber-500 hover:to-amber-300 shadow-sm"
                                        style={{ height: `${barHeightPercent}%` }}
                                    />
                                    <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap mt-1">
                                        {item.day}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Event Performance Breakdown Table */}
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
                    <div className="p-6 border-b border-border/40 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">
                                Event Performance Roster
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Individual event turnout rates and capacity fulfillment.
                            </p>
                        </div>
                    </div>

                    {eventPerformance.length === 0 ? (
                        <div className="p-10 text-center text-sm text-muted-foreground">
                            No active events found. Create and publish an event to see analytics.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border/40 bg-muted/30 text-xs uppercase font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3.5">Event</th>
                                        <th className="px-6 py-3.5">Date</th>
                                        <th className="px-6 py-3.5">Capacity Filled</th>
                                        <th className="px-6 py-3.5">Check-Ins</th>
                                        <th className="px-6 py-3.5">Turnout %</th>
                                        <th className="px-6 py-3.5 text-right">Quick Access</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {eventPerformance.map((item) => {
                                        const pct = Math.min(100, Math.round((item.registrations_count / item.capacity) * 100));

                                        return (
                                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-foreground truncate max-w-sm">
                                                        {item.title}
                                                    </div>
                                                    <div className="text-xs text-amber-400 font-medium mt-0.5">
                                                        {item.category || 'General'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                    {formatDate(item.starts_at)}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono font-semibold text-foreground">
                                                            {item.registrations_count} / {item.capacity}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">({pct}%)</span>
                                                    </div>
                                                    <div className="h-1.5 w-28 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-500 rounded-full"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold text-emerald-400">
                                                    {item.check_ins_count} checked-in
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                                        {item.turnout_rate}%
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button asChild size="sm" variant="outline" className="border-border/60 hover:border-amber-500/50">
                                                            <Link href={`/organizer/events/${item.id}/check-in`} className="flex items-center gap-1.5">
                                                                <QrCode className="h-3.5 w-3.5 text-amber-400" />
                                                                <span>Scan</span>
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link href={`/organizer/events/${item.id}/edit`}>
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Registrations Roster */}
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
                    <div className="p-6 border-b border-border/40 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">
                                Latest Attendee Registrations
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Real-time feed of participants registering across your events.
                            </p>
                        </div>
                    </div>

                    {recentRegistrations.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                            No registrations received yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {recentRegistrations.map((reg) => (
                                <div key={reg.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                                            {reg.attendee_name}
                                            {reg.is_checked_in && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                                                    Arrived
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {reg.attendee_email} {reg.attendee_company && `• ${reg.attendee_company}`}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-sm">
                                            {reg.event_title}
                                        </div>
                                        <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                                            {reg.ticket_code}
                                        </div>
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

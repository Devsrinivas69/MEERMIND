import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Users,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Hourglass,
    Search,
    Download,
    QrCode,
    Sparkles,
    Calendar,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    MessageSquare,
    AlertTriangle,
    FileText,
    Filter,
    CheckSquare,
    Square
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { OrganizerCopilot } from '@/components/organizer-copilot';
import type { BreadcrumbItem, Event, Registration } from '@/types';

type PaginatedRegistrations = {
    data: Registration[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    event: Event;
    registrations: PaginatedRegistrations;
    stats: {
        total_applications: number;
        pending_count: number;
        approved_count: number;
        waitlisted_count: number;
        rejected_count: number;
        capacity: number;
        remaining_capacity: number;
    };
    filters: {
        status: string;
        search: string;
    };
};

export default function EventRegistrationsManagement({ event, registrations, stats, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || 'pending');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

    // Single Reject Modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTargetRegistration, setRejectTargetRegistration] = useState<Registration | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Bulk Action Modal
    const [bulkConfirmModal, setBulkConfirmModal] = useState<{ open: boolean; action: 'approve' | 'reject' | 'waitlist' }>({
        open: false,
        action: 'approve',
    });
    const [bulkReason, setBulkReason] = useState('');

    // Notes editing
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [noteContent, setNoteContent] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Organizer Dashboard', href: '/organizer/dashboard' },
        { title: 'My Events', href: '/organizer/events' },
        { title: event.title, href: `/events/${event.slug}` },
        { title: 'Applications & Registrations', href: `/organizer/events/${event.id}/registrations` },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(`/organizer/events/${event.id}/registrations`, {
            status: statusFilter,
            search: searchQuery,
        }, { preserveState: true });
    };

    const handleTabChange = (status: string) => {
        setStatusFilter(status);
        setSelectedIds([]);
        router.get(`/organizer/events/${event.id}/registrations`, {
            status,
            search: searchQuery,
        }, { preserveState: true });
    };

    const handleSelectAll = () => {
        if (selectedIds.length === registrations.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(registrations.data.map((r) => r.id));
        }
    };

    const handleToggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSingleApprove = (registration: Registration) => {
        setActionLoading(registration.id);
        router.post(`/organizer/registrations/${registration.id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setActionLoading(null),
        });
    };

    const handleOpenRejectModal = (registration: Registration) => {
        setRejectTargetRegistration(registration);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleConfirmReject = () => {
        if (!rejectTargetRegistration) return;
        setActionLoading(rejectTargetRegistration.id);
        router.post(`/organizer/registrations/${rejectTargetRegistration.id}/reject`, {
            reason: rejectReason,
        }, {
            preserveScroll: true,
            onSuccess: () => setRejectModalOpen(false),
            onFinish: () => setActionLoading(null),
        });
    };

    const handleSingleWaitlist = (registration: Registration) => {
        setActionLoading(registration.id);
        router.post(`/organizer/registrations/${registration.id}/waitlist`, {}, {
            preserveScroll: true,
            onFinish: () => setActionLoading(null),
        });
    };

    const handleSaveNote = (registration: Registration) => {
        router.post(`/organizer/registrations/${registration.id}/notes`, {
            notes: noteContent,
        }, {
            preserveScroll: true,
            onSuccess: () => setEditingNoteId(null),
        });
    };

    const handleExecuteBulkAction = () => {
        setBulkLoading(true);
        router.post(`/organizer/events/${event.id}/registrations/bulk`, {
            action: bulkConfirmModal.action,
            registration_ids: selectedIds,
            reason: bulkReason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setBulkConfirmModal({ open: false, action: 'approve' });
                setSelectedIds([]);
            },
            onFinish: () => setBulkLoading(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Registration Applications — ${event.title}`} />

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
                                <Hourglass className="h-3 w-3 mr-1" />
                                Application Review Active
                            </Badge>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                            Registration Management & Application Review
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{event.title}</span>
                            <span>•</span>
                            <span>{stats.remaining_capacity} Seats Available ({stats.approved_count} Approved)</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <OrganizerCopilot
                            eventId={event.id}
                            eventTitle={event.title}
                            capacity={stats.capacity}
                            registeredCount={stats.approved_count}
                            pendingCount={stats.pending_count}
                        />
                        <Button asChild variant="outline" size="sm" className="border-border/60">
                            <a href={`/organizer/events/${event.id}/registrations/export?status=${statusFilter}`}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="border-border/60">
                            <Link href={`/organizer/events/${event.id}/check-in`}>
                                <QrCode className="h-4 w-4 mr-2" />
                                Live Scanner
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold">
                            <Link href={`/events/${event.slug}`}>
                                Public Event Page
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics & Capacity Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {/* Total Applications */}
                    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Applications
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                            {stats.total_applications}
                        </div>
                    </div>

                    {/* Pending Review */}
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm">
                        <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Pending</span>
                            <Hourglass className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                            {stats.pending_count}
                        </div>
                    </div>

                    {/* Approved Attendees */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm">
                        <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Approved</span>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                            {stats.approved_count}
                        </div>
                    </div>

                    {/* Waitlisted */}
                    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 shadow-sm">
                        <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Waitlist</span>
                            <Users className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">
                            {stats.waitlisted_count}
                        </div>
                    </div>

                    {/* Rejected */}
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 shadow-sm">
                        <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Declined</span>
                            <XCircle className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">
                            {stats.rejected_count}
                        </div>
                    </div>

                    {/* Capacity Remaining */}
                    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Seats Left
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                {stats.remaining_capacity}
                            </span>
                            <span className="text-xs text-muted-foreground">/ {stats.capacity}</span>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/40 overflow-x-auto">
                        {[
                            { key: 'pending', label: 'Pending Review', count: stats.pending_count },
                            { key: 'approved', label: 'Approved', count: stats.approved_count },
                            { key: 'waitlisted', label: 'Waitlist', count: stats.waitlisted_count },
                            { key: 'rejected', label: 'Declined', count: stats.rejected_count },
                            { key: 'all', label: 'All Applications', count: stats.total_applications },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabChange(tab.key)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                    statusFilter === tab.key
                                        ? 'bg-card text-foreground shadow-sm border border-border/60'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-muted text-foreground">
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, email, company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-xl border-border/60 bg-card"
                            />
                        </div>
                        <Button type="submit" size="sm" variant="outline" className="border-border/60 h-9">
                            Search
                        </Button>
                    </form>
                </div>

                {/* Bulk Actions Bar (Shown when 1 or more items selected) */}
                {selectedIds.length > 0 && (
                    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                            <CheckSquare className="h-4 w-4" />
                            <span>{selectedIds.length} applicant(s) selected</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setBulkConfirmModal({ open: true, action: 'approve' })}
                                className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs h-8"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Bulk Approve ({selectedIds.length})
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setBulkConfirmModal({ open: true, action: 'waitlist' })}
                                className="border-purple-500/40 text-purple-300 hover:bg-purple-950/20 text-xs h-8"
                            >
                                Move to Waitlist
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setBulkConfirmModal({ open: true, action: 'reject' })}
                                className="border-rose-500/40 text-rose-400 hover:bg-rose-950/20 text-xs h-8"
                            >
                                Bulk Reject
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIds([])}
                                className="text-xs text-muted-foreground hover:text-foreground h-8"
                            >
                                Deselect All
                            </Button>
                        </div>
                    </div>
                )}

                {/* Applications Table / Cards List */}
                <div className="rounded-3xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    {registrations.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <Hourglass className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-foreground">No Applications Found</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                There are no attendee applications matching the selected "{statusFilter}" filter criteria.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {/* Table Header Row */}
                            <div className="p-4 bg-muted/20 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-muted-foreground hover:text-foreground p-0.5"
                                    >
                                        {selectedIds.length === registrations.data.length ? (
                                            <CheckSquare className="h-4 w-4 text-amber-400" />
                                        ) : (
                                            <Square className="h-4 w-4" />
                                        )}
                                    </button>
                                    <span>Applicant</span>
                                </div>
                                <div className="hidden md:flex items-center gap-12">
                                    <span>Applied</span>
                                    <span>Status</span>
                                    <span>Actions</span>
                                </div>
                            </div>

                            {/* Applicant Rows */}
                            {registrations.data.map((reg) => {
                                const isSelected = selectedIds.includes(reg.id);
                                const isExpanded = expandedAppId === reg.id;
                                const hasAnswers = reg.answers && Object.keys(reg.answers).length > 0;

                                return (
                                    <div
                                        key={reg.id}
                                        className={`p-4 sm:p-5 transition-colors ${
                                            isSelected ? 'bg-amber-500/5' : 'hover:bg-muted/15'
                                        }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Left: Checkbox + User Info */}
                                            <div className="flex items-start gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSelect(reg.id)}
                                                    className="mt-1 text-muted-foreground hover:text-foreground p-0.5"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="h-4 w-4 text-amber-400" />
                                                    ) : (
                                                        <Square className="h-4 w-4" />
                                                    )}
                                                </button>

                                                <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-sm text-amber-400 shrink-0">
                                                    {reg.user?.name ? reg.user.name.charAt(0).toUpperCase() : 'A'}
                                                </div>

                                                <div>
                                                    <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                                        <span>{reg.user?.name}</span>
                                                        {reg.ticket && (
                                                            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                                                {reg.ticket.ticket_code}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {reg.user?.email} • {reg.user?.job_title ? `${reg.user.job_title} at ` : ''}{reg.user?.company || 'Independent'}
                                                    </div>

                                                    {/* Motivation Notes preview */}
                                                    {reg.notes && (
                                                        <p className="text-xs text-foreground/80 mt-1.5 italic bg-muted/30 p-2 rounded-lg max-w-xl">
                                                            "{reg.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Date, Status Badge & Action Controls */}
                                            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/20">
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(reg.application_submitted_at || reg.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    })}
                                                </div>

                                                {/* Status Badge */}
                                                <div>
                                                    {reg.status === 'pending' ? (
                                                        <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs">
                                                            Pending Review
                                                        </Badge>
                                                    ) : reg.status === 'approved' || reg.status === 'confirmed' ? (
                                                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs">
                                                            Approved
                                                        </Badge>
                                                    ) : reg.status === 'waitlisted' ? (
                                                        <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-500/10 text-xs">
                                                            Waitlisted
                                                        </Badge>
                                                    ) : reg.status === 'rejected' ? (
                                                        <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 text-xs">
                                                            Declined
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-border text-muted-foreground text-xs capitalize">
                                                            {reg.status}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1.5">
                                                    {reg.status !== 'approved' && reg.status !== 'confirmed' && (
                                                        <Button
                                                            size="sm"
                                                            disabled={actionLoading === reg.id || stats.remaining_capacity <= 0}
                                                            onClick={() => handleSingleApprove(reg)}
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs h-8"
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}

                                                    {reg.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={actionLoading === reg.id}
                                                                onClick={() => handleSingleWaitlist(reg)}
                                                                className="border-purple-500/40 text-purple-400 hover:bg-purple-950/20 text-xs h-8"
                                                            >
                                                                Waitlist
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={actionLoading === reg.id}
                                                                onClick={() => handleOpenRejectModal(reg)}
                                                                className="border-rose-500/40 text-rose-400 hover:bg-rose-950/20 text-xs h-8"
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}

                                                    {(hasAnswers || reg.review_notes) && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setExpandedAppId(isExpanded ? null : reg.id)}
                                                            className="text-xs text-muted-foreground h-8 px-2"
                                                        >
                                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details: Custom Questions & Internal Notes */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-muted/20 p-3 rounded-2xl">
                                                {/* Custom Answers */}
                                                <div>
                                                    <div className="font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <FileText className="h-3.5 w-3.5 text-amber-400" />
                                                        Application Responses
                                                    </div>
                                                    {hasAnswers ? (
                                                        <div className="space-y-1.5">
                                                            {Object.entries(reg.answers || {}).map(([key, val]) => (
                                                                <div key={key}>
                                                                    <span className="font-semibold text-foreground capitalize">{key}: </span>
                                                                    <span className="text-muted-foreground">{String(val)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted-foreground italic">No custom questions answered.</p>
                                                    )}
                                                </div>

                                                {/* Internal Review Notes */}
                                                <div>
                                                    <div className="font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                                                        Internal Organizer Notes
                                                    </div>
                                                    {editingNoteId === reg.id ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={noteContent}
                                                                onChange={(e) => setNoteContent(e.target.value)}
                                                                rows={2}
                                                                className="w-full rounded-xl border border-input bg-card p-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                                                placeholder="Add notes visible only to co-organizers..."
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <Button size="sm" onClick={() => handleSaveNote(reg)} className="h-7 text-xs bg-amber-500 text-neutral-950 font-bold">
                                                                    Save Note
                                                                </Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)} className="h-7 text-xs">
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-muted-foreground italic">
                                                                {reg.review_notes || 'No internal review notes added.'}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingNoteId(reg.id);
                                                                    setNoteContent(reg.review_notes || '');
                                                                }}
                                                                className="text-amber-400 hover:underline font-semibold shrink-0"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Single Rejection Modal */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="sm:max-w-md bg-card border-border/80">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            Decline Application: {rejectTargetRegistration?.user?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            The applicant will be marked as REJECTED and notified via email. You can optionally include an explanation note.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Rejection Reason (Optional)
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Venue capacity exceeded, prioritizing local developers for this session..."
                            rows={3}
                            className="w-full rounded-xl border border-input bg-background/50 p-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="border-border/60">
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmReject} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Actions Confirmation Modal */}
            <Dialog open={bulkConfirmModal.open} onOpenChange={(open) => setBulkConfirmModal({ ...bulkConfirmModal, open })}>
                <DialogContent className="sm:max-w-md bg-card border-border/80">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground capitalize">
                            Confirm Bulk {bulkConfirmModal.action}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            You are about to execute a bulk **{bulkConfirmModal.action}** for **{selectedIds.length}** selected applications.
                            {bulkConfirmModal.action === 'approve' && (
                                <span className="block mt-1 font-semibold text-amber-400">
                                    Current remaining capacity: {stats.remaining_capacity} seats.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {bulkConfirmModal.action === 'reject' && (
                        <div className="space-y-2 pt-2">
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Reason for Rejection (Optional)
                            </label>
                            <textarea
                                value={bulkReason}
                                onChange={(e) => setBulkReason(e.target.value)}
                                placeholder="Included in the notification email..."
                                rows={2}
                                className="w-full rounded-xl border border-input bg-background/50 p-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                            />
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setBulkConfirmModal({ ...bulkConfirmModal, open: false })} className="border-border/60">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExecuteBulkAction}
                            disabled={bulkLoading}
                            className={`font-bold ${
                                bulkConfirmModal.action === 'approve'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-neutral-950'
                                    : bulkConfirmModal.action === 'reject'
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                        >
                            {bulkLoading ? 'Processing...' : `Confirm Bulk ${bulkConfirmModal.action}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

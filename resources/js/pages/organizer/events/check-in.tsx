import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    ArrowLeft,
    QrCode,
    Camera,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Users,
    Search,
    RefreshCw,
    Clock,
    Sparkles,
    ShieldAlert
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem, CheckIn, Event } from '@/types';

type CheckInResult = {
    success: boolean;
    status: 'checked_in' | 'already_used' | 'wrong_event' | 'cancelled' | 'not_found' | 'error';
    message: string;
    attendee?: {
        name: string;
        email?: string;
        company?: string;
        job_title?: string;
        ticket_code?: string;
        checked_in_at?: string;
    };
    updated_stats?: {
        total_registered: number;
        total_checked_in: number;
        capacity: number;
    };
};

type Props = {
    event: Event;
    recentCheckIns: CheckIn[];
    stats: {
        total_registered: number;
        total_checked_in: number;
        capacity: number;
    };
};

export default function CheckInTerminal({ event, recentCheckIns: initialCheckIns, stats: initialStats }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Organizer Studio',
            href: '/organizer/events',
        },
        {
            title: event.title,
            href: `/organizer/events/${event.id}/edit`,
        },
        {
            title: 'Check-In Terminal',
            href: `/organizer/events/${event.id}/check-in`,
        },
    ];

    const [manualCode, setManualCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
    const [stats, setStats] = useState(initialStats);
    const [checkInList, setCheckInList] = useState<CheckIn[]>(initialCheckIns);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Verify Check-in via API
    const processVerification = async (payload: { token?: string; code?: string; method?: string }) => {
        setSubmitting(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            const response = await fetch(`/organizer/events/${event.id}/check-in/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            const data: CheckInResult = await response.json();
            setLastResult(data);

            if (data.success && data.updated_stats) {
                setStats(data.updated_stats);
                setManualCode('');

                // Prepend to recent check-ins
                if (data.attendee) {
                    const newEntry: any = {
                        id: Date.now(),
                        ticket_id: 0,
                        event_id: event.id,
                        checked_in_at: new Date().toISOString(),
                        method: payload.method || 'qr_scan',
                        ticket: {
                            ticket_code: data.attendee.ticket_code,
                            registration: {
                                user: {
                                    name: data.attendee.name,
                                    email: data.attendee.email,
                                    company: data.attendee.company,
                                }
                            }
                        }
                    };
                    setCheckInList([newEntry, ...checkInList]);
                }
            }
        } catch (err: any) {
            setLastResult({
                success: false,
                status: 'error',
                message: 'Network or verification server error occurred. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCode.trim()) return;

        // Check if input looks like full 64-char hex token or short ticket code
        if (manualCode.length > 20) {
            processVerification({ token: manualCode.trim(), method: 'qr_scan' });
        } else {
            processVerification({ code: manualCode.trim(), method: 'manual_code' });
        }
    };

    // Camera scanner toggle
    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCameraActive(true);
        } catch (err: any) {
            setCameraError('Camera access denied or no camera device found on this machine.');
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const attendancePct = stats.total_registered > 0
        ? Math.round((stats.total_checked_in / stats.total_registered) * 100)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Check-in Terminal: ${event.title} — MeetMind AI`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
                    <div>
                        <Link
                            href="/organizer/events"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Events
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                            Live Check-In Terminal
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {event.title} • {event.venue_name || event.venue_city || 'Online'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="border-border/60">
                            <Link href={`/events/${event.slug}`} target="_blank">
                                View Public Page
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Live Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-border/50 bg-card">
                        <div className="text-xs text-muted-foreground uppercase font-mono">Checked In</div>
                        <div className="text-3xl font-bold text-emerald-400 mt-1 font-mono">
                            {stats.total_checked_in}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Attendees arrived</div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border/50 bg-card">
                        <div className="text-xs text-muted-foreground uppercase font-mono">Total Registered</div>
                        <div className="text-3xl font-bold text-foreground mt-1 font-mono">
                            {stats.total_registered}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Confirmed passes</div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border/50 bg-card">
                        <div className="text-xs text-muted-foreground uppercase font-mono">Turnout Rate</div>
                        <div className="text-3xl font-bold text-amber-400 mt-1 font-mono">
                            {attendancePct}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Check-in velocity</div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border/50 bg-card">
                        <div className="text-xs text-muted-foreground uppercase font-mono">Total Capacity</div>
                        <div className="text-3xl font-bold text-foreground mt-1 font-mono">
                            {stats.capacity}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Max venue limit</div>
                    </div>
                </div>

                {/* Validation Result Flash Banner */}
                {lastResult && (
                    <div
                        className={`rounded-2xl p-5 border transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                            lastResult.success
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : lastResult.status === 'already_used'
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : 'bg-red-500/15 border-red-500/40 text-red-300'
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            {lastResult.success ? (
                                <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0 mt-0.5" />
                            ) : lastResult.status === 'already_used' ? (
                                <AlertTriangle className="h-7 w-7 text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="h-7 w-7 text-red-400 shrink-0 mt-0.5" />
                            )}

                            <div className="flex-1">
                                <div className="font-bold text-base sm:text-lg">
                                    {lastResult.message}
                                </div>
                                {lastResult.attendee && (
                                    <div className="mt-2 text-sm text-foreground/90 flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <span><strong>Name:</strong> {lastResult.attendee.name}</span>
                                        {lastResult.attendee.company && (
                                            <span><strong>Company:</strong> {lastResult.attendee.company}</span>
                                        )}
                                        {lastResult.attendee.ticket_code && (
                                            <span className="font-mono"><strong>Pass:</strong> {lastResult.attendee.ticket_code}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setLastResult(null)}
                                className="text-xs uppercase tracking-wider underline hover:opacity-80"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Two Column Scanner & Roster */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left: QR Scanner & Manual Input (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Camera Scanner Box */}
                        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                                    <Camera className="h-5 w-5 text-amber-400" />
                                    Camera QR Scanner
                                </h2>
                                {cameraActive ? (
                                    <Button onClick={stopCamera} size="sm" variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10">
                                        Turn Off Camera
                                    </Button>
                                ) : (
                                    <Button onClick={startCamera} size="sm" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold">
                                        Activate Camera
                                    </Button>
                                )}
                            </div>

                            {cameraActive ? (
                                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-amber-500/40 flex items-center justify-center">
                                    <video ref={videoRef} className="h-full w-full object-cover" />
                                    {/* Crosshair Scanner Frame */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-amber-400/80 rounded-2xl relative shadow-lg">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1" />
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1" />
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1" />
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video w-full rounded-xl border border-dashed border-border/70 bg-muted/20 flex flex-col items-center justify-center text-center p-6">
                                    <QrCode className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                    <p className="text-sm font-medium text-foreground">Camera is offline</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                        Click "Activate Camera" to scan tickets directly from attendee smartphone screens.
                                    </p>
                                    {cameraError && (
                                        <div className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg max-w-sm">
                                            {cameraError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Manual Fallback Code Box */}
                        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                            <h2 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-amber-400" />
                                Manual Ticket Verification
                            </h2>
                            <p className="text-xs text-muted-foreground mb-4">
                                If the attendee's screen is cracked or camera is unavailable, enter their ticket code (e.g. <span className="font-mono text-amber-400 font-semibold">MM-2026-9041</span>) or paste the QR token:
                            </p>

                            <form onSubmit={handleManualSubmit} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="MM-2026-XXXX or QR token..."
                                        className="h-11 font-mono uppercase text-sm"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="h-11 px-6 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
                                >
                                    {submitting ? 'Verifying...' : 'Check In'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Real-time Check-In Roster (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col h-full">
                            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
                                <h2 className="font-semibold text-base text-foreground flex items-center gap-2">
                                    <Users className="h-4 w-4 text-emerald-400" />
                                    Live Entrance Roster
                                </h2>
                                <span className="text-xs font-mono text-muted-foreground">
                                    {checkInList.length} recorded
                                </span>
                            </div>

                            {checkInList.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground text-xs">
                                    No attendees checked in yet today.
                                </div>
                            ) : (
                                <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                                    {checkInList.map((entry) => {
                                        const attendee = entry.ticket?.registration?.user;
                                        const timeStr = entry.checked_in_at
                                            ? new Date(entry.checked_in_at).toLocaleTimeString('en-US', {
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  second: '2-digit',
                                              })
                                            : 'Just now';

                                        return (
                                            <div
                                                key={entry.id}
                                                className="p-3 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between text-xs"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <div className="font-semibold text-foreground truncate">
                                                        {attendee?.name || 'Attendee'}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground truncate font-mono">
                                                        {entry.ticket?.ticket_code} {attendee?.company && `• ${attendee.company}`}
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className="font-mono text-emerald-400 font-medium">
                                                        {timeStr}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">
                                                        {entry.method}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

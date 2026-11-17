import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    Compass,
    QrCode,
    Ticket,
    Sparkles,
    BarChart3,
    ArrowRight,
    Users,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auth, BreadcrumbItem } from '@/types';

export default function Dashboard() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard — MeetMind AI" />

            <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
                {/* Welcome Hero Banner */}
                <div className="relative rounded-3xl border border-amber-500/20 bg-gradient-to-br from-card via-card to-amber-950/15 p-6 sm:p-10 shadow-xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Sparkles className="h-44 w-44 text-amber-400" />
                    </div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" />
                                MeetMind AI Platform
                            </span>
                            <Badge variant="outline" className="capitalize text-xs">
                                {user?.role || 'Attendee'} Account
                            </Badge>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">{user?.name}</span>
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {isOrganizer
                                ? 'Manage your technical conferences, monitor real-time scanner attendance, and explore AI-synthesized attendee sentiment.'
                                : 'Explore upcoming world-class tech conferences, access your digital QR boarding passes, and converse with grounded event assistants.'}
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            {isOrganizer ? (
                                <>
                                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-md shadow-amber-500/20">
                                        <Link href="/organizer/dashboard">
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Organizer Analytics
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="border-border/60">
                                        <Link href="/organizer/events">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Manage Events
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="border-border/60">
                                        <Link href="/organizer/check-in">
                                            <QrCode className="h-4 w-4 mr-2" />
                                            Live QR Scanner
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-md shadow-amber-500/20">
                                        <Link href="/events">
                                            <Compass className="h-4 w-4 mr-2" />
                                            Explore Events
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="border-border/60">
                                        <Link href="/attendee/tickets">
                                            <Ticket className="h-4 w-4 mr-2" />
                                            My Digital Passes
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Action Hub Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Action 1 */}
                    <Link
                        href="/events"
                        className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-amber-500/50 hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                                <Compass className="h-5 w-5" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-base font-bold text-foreground mb-1">Public Event Discovery</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Browse tech conferences, hands-on workshops, and keynotes with category filters.
                        </p>
                    </Link>

                    {/* Action 2 */}
                    <Link
                        href={isOrganizer ? "/organizer/dashboard" : "/attendee/tickets"}
                        className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-amber-500/50 hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                                {isOrganizer ? <BarChart3 className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-base font-bold text-foreground mb-1">
                            {isOrganizer ? "Executive Analytics" : "Digital QR Passes"}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {isOrganizer
                                ? "Inspect real-time turnout metrics, registration velocity, and capacity utilization."
                                : "Access cryptographically signed HMAC QR tickets with instant boarding pass layout."}
                        </p>
                    </Link>

                    {/* Action 3 */}
                    <Link
                        href={isOrganizer ? "/organizer/check-in" : "/events"}
                        className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-amber-500/50 hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                                <QrCode className="h-5 w-5" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-base font-bold text-foreground mb-1">
                            {isOrganizer ? "Live Check-In Scanner" : "Grounded AI Assistance"}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {isOrganizer
                                ? "Scan camera tickets with instant duplicate rejection and real-time attendance logs."
                                : "Chat with official AI assistants on event pages with zero hallucinations."}
                        </p>
                    </Link>
                </div>

                {/* Security & Concurrency Guarantee Card */}
                <div className="rounded-2xl border border-border/40 bg-card/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">MeetMind Security Protocol Active: </span>
                            HMAC-SHA256 signed QR tokens, row-level write locks (`lockForUpdate`), and rate-limited AI endpoints.
                        </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        System Protected
                    </Badge>
                </div>
            </div>
        </AppLayout>
    );
}

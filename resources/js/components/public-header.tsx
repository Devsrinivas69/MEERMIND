import { Link, usePage } from '@inertiajs/react';
import { Calendar, Compass, Sparkles, User, Ticket, QrCode } from 'lucide-react';
import type { Auth } from '@/types';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo & Brand */}
                <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-sm">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold tracking-tight text-foreground text-lg flex items-center gap-1.5">
                            MeetMind <span className="text-xs uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono font-medium">AI</span>
                        </span>
                    </div>
                </Link>

                {/* Primary Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link
                        href="/events"
                        className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
                    >
                        <Compass className="h-4 w-4 text-amber-500/80" />
                        Explore Events
                    </Link>
                    {user && (
                        <Link
                            href="/attendee/tickets"
                            className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
                        >
                            <Ticket className="h-4 w-4" />
                            My Tickets
                        </Link>
                    )}
                    {user?.role === 'organizer' && (
                        <Link
                            href="/organizer/events"
                            className="text-amber-400 transition-colors hover:text-amber-300 flex items-center gap-1.5"
                        >
                            <Calendar className="h-4 w-4" />
                            Organizer Studio
                        </Link>
                    )}
                </nav>

                {/* User / Auth Actions */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-2">
                            {user.role === 'organizer' && (
                                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex border-amber-500/30 hover:border-amber-500/50 text-amber-400">
                                    <Link href="/organizer/events/create">
                                        + Create Event
                                    </Link>
                                </Button>
                            )}
                            <Button asChild size="sm" variant="ghost">
                                <Link href="/dashboard" className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                        {user.name.charAt(0)}
                                    </div>
                                    <span className="hidden sm:inline-block">{user.name.split(' ')[0]}</span>
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-medium shadow-sm">
                                <Link href="/register">Get Started</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

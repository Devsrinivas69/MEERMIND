import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, MapPin, Video, Users, Search, Filter, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Event, EventCategory } from '@/types';

type PaginationData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    events: PaginationData<Event>;
    categories: EventCategory[];
    filters: {
        search: string;
        category: string;
        type: string;
        timing: string;
    };
};

export default function EventsIndex({ events, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/events', {
            search,
            category: selectedCategory,
            type: selectedType,
        }, { preserveState: true });
    };

    const handleCategoryClick = (slug: string) => {
        const newCat = selectedCategory === slug ? '' : slug;
        setSelectedCategory(newCat);
        router.get('/events', {
            search,
            category: newCat,
            type: selectedType,
        }, { preserveState: true });
    };

    const handleTypeChange = (type: string) => {
        const newType = selectedType === type ? '' : type;
        setSelectedType(newType);
        router.get('/events', {
            search,
            category: selectedCategory,
            type: newType,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedType('');
        router.get('/events');
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
            <Head title="Explore Events — MeetMind AI" />
            <PublicHeader />

            {/* Hero Header */}
            <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-card/80 to-background py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-70 pointer-events-none" />
                <div className="container mx-auto max-w-5xl relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-400 mb-6 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI-Powered Event Discovery & Intelligence
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground font-serif">
                        Where Great Minds <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Convene</span>
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Discover world-class tech conferences, executive roundtables, and hands-on workshops with instant digital QR ticketing.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto flex items-center gap-2 rounded-xl border border-border/60 bg-card/90 p-1.5 shadow-lg backdrop-blur">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search events by title, keyword, or city..."
                                className="pl-10 h-11 border-0 bg-transparent focus-visible:ring-0 text-sm shadow-none"
                            />
                        </div>
                        <Button type="submit" className="h-11 px-6 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold shadow-sm">
                            Search
                        </Button>
                    </form>
                </div>
            </section>

            {/* Filter Bar */}
            <section className="border-b border-border/30 bg-card/30 sticky top-16 z-40 backdrop-blur-md">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
                    {/* Category Badges */}
                    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            type="button"
                            onClick={() => handleCategoryClick('')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                selectedCategory === ''
                                    ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            All Categories
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.slug)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                                    selectedCategory === cat.slug
                                        ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <span>{cat.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Format / Type Filters */}
                    <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/40 text-xs">
                        {['in-person', 'virtual', 'hybrid'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleTypeChange(type)}
                                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                                    selectedType === type
                                        ? 'bg-background text-foreground font-medium shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Events Grid */}
            <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex-1">
                {events.data.length === 0 ? (
                    <div className="text-center py-20 max-w-md mx-auto">
                        <div className="h-16 w-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground mb-4">
                            <Search className="h-8 w-8 text-muted-foreground/60" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No events found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            We couldn't find any events matching your criteria. Try adjusting your search or clear your filters.
                        </p>
                        <Button onClick={clearFilters} variant="outline" className="mt-6 border-border/60">
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                                Upcoming Events
                                <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                    {events.total} available
                                </span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {events.data.map((event) => {
                                const spotsLeft = Math.max(0, event.capacity - event.registered_count);
                                const isAlmostFull = spotsLeft <= Math.ceil(event.capacity * 0.15) && spotsLeft > 0;
                                const isSoldOut = spotsLeft === 0;

                                return (
                                    <div
                                        key={event.id}
                                        className="group relative flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
                                    >
                                        {/* Cover Image */}
                                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                            {event.cover_image ? (
                                                <img
                                                    src={event.cover_image}
                                                    alt={event.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center text-muted-foreground">
                                                    <Calendar className="h-10 w-10 text-muted-foreground/40" />
                                                </div>
                                            )}

                                            {/* Badges Overlay */}
                                            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                                                {event.category && (
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-medium backdrop-blur-md bg-black/60 text-amber-400 border border-amber-500/30">
                                                        {event.category.name}
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 rounded-md text-xs font-medium backdrop-blur-md bg-neutral-950/70 text-neutral-300 capitalize">
                                                    {event.event_type}
                                                </span>
                                            </div>

                                            {isAlmostFull && (
                                                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/90 text-neutral-950 font-semibold shadow-xs">
                                                    Selling Fast
                                                </div>
                                            )}
                                            {isSoldOut && (
                                                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/90 text-white font-semibold shadow-xs">
                                                    Sold Out
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Body */}
                                        <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between">
                                            <div>
                                                {/* Date & Time */}
                                                <div className="flex items-center gap-2 text-xs font-medium text-amber-400/90 mb-2.5">
                                                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>{formatDate(event.starts_at)}</span>
                                                    <span>•</span>
                                                    <span>{formatTime(event.starts_at)}</span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-semibold text-lg text-foreground tracking-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
                                                    <Link href={`/events/${event.slug}`}>
                                                        {event.title}
                                                    </Link>
                                                </h3>

                                                {/* Summary */}
                                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {event.summary || event.description.substring(0, 140) + '...'}
                                                </p>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-border/40">
                                                {/* Location & Capacity */}
                                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                                    <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                                                        {event.event_type === 'virtual' ? (
                                                            <>
                                                                <Video className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                <span className="truncate">Online Stream</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                <span className="truncate">{event.venue_city || event.venue_name || 'In-Person'}</span>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 font-mono">
                                                        <Users className="h-3.5 w-3.5" />
                                                        <span>{spotsLeft} left</span>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <Button asChild className="w-full bg-card hover:bg-accent text-foreground border border-border/60 hover:border-amber-500/50 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-all font-medium">
                                                    <Link href={`/events/${event.slug}`} className="flex items-center justify-center gap-1.5">
                                                        <span>View & Register</span>
                                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Links if needed */}
                        {events.last_page > 1 && (
                            <div className="mt-12 flex justify-center gap-2">
                                {events.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={Boolean(link.url)}
                                        disabled={!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className={link.active ? 'bg-amber-500 text-neutral-950 font-semibold' : ''}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

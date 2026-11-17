import { Head, Link, useForm } from '@inertiajs/react';
import {
    Calendar,
    ArrowLeft,
    Sparkles,
    MapPin,
    Video,
    Users,
    UploadCloud,
    Check
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem, EventCategory } from '@/types';

type Props = {
    categories: EventCategory[];
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
    {
        title: 'Create Event',
        href: '/organizer/events/create',
    },
];

export default function OrganizerEventCreate({ categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        summary: '',
        description: '',
        cover_image: null as File | null,
        event_type: 'in-person',
        venue_name: '',
        venue_address: '',
        venue_city: '',
        virtual_meeting_url: '',
        starts_at: '',
        ends_at: '',
        registration_deadline: '',
        capacity: 100,
        status: 'published',
        is_featured: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/organizer/events', {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create New Event — MeetMind AI" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-border/40">
                    <div>
                        <Link
                            href="/organizer/events"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Events
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                            Create New Event
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure event details, venue or livestream links, schedule, and attendee capacity limits.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info Card */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 space-y-6">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            General Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Event Title *</Label>
                                <Input
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Autonomous AI Engineering Summit 2026"
                                    className="mt-1.5"
                                    required
                                />
                                {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category_id">Category</Label>
                                    <select
                                        id="category_id"
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && <p className="text-xs text-red-400 mt-1">{errors.category_id}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="event_type">Format *</Label>
                                    <select
                                        id="event_type"
                                        value={data.event_type}
                                        onChange={(e) => setData('event_type', e.target.value)}
                                        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        <option value="in-person">In-Person</option>
                                        <option value="virtual">Virtual / Webinar</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                    {errors.event_type && <p className="text-xs text-red-400 mt-1">{errors.event_type}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="summary">Short Pitch / Summary (Max 500 characters)</Label>
                                <Input
                                    id="summary"
                                    type="text"
                                    value={data.summary}
                                    onChange={(e) => setData('summary', e.target.value)}
                                    placeholder="A concise one-liner highlighting key value propositions for attendee cards."
                                    className="mt-1.5"
                                    maxLength={500}
                                />
                                {errors.summary && <p className="text-xs text-red-400 mt-1">{errors.summary}</p>}
                            </div>

                            <div>
                                <Label htmlFor="description">Full Agenda & Description *</Label>
                                <textarea
                                    id="description"
                                    rows={8}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Detailed schedule, speaker highlights, workshop prerequisites, and expectations..."
                                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    required
                                />
                                {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
                            </div>

                            <div>
                                <Label htmlFor="cover_image">Cover Image Upload</Label>
                                <div className="mt-1.5 flex items-center justify-center rounded-xl border border-dashed border-border/80 px-6 py-6 hover:border-amber-500/50 transition-colors">
                                    <div className="text-center">
                                        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <label htmlFor="cover_image" className="cursor-pointer font-medium text-amber-400 hover:text-amber-300">
                                                <span>Click to upload image</span>
                                                <input
                                                    id="cover_image"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setData('cover_image', e.target.files?.[0] || null)}
                                                    className="sr-only"
                                                />
                                            </label>
                                            <span className="pl-1">or drag and drop</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground/70 mt-1">PNG, JPG, WebP up to 5MB</p>
                                        {data.cover_image && (
                                            <p className="mt-2 text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                                                <Check className="h-3.5 w-3.5" /> Selected: {data.cover_image.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {errors.cover_image && <p className="text-xs text-red-400 mt-1">{errors.cover_image}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Venue & Coordinates */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 space-y-6">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-amber-500" />
                            Location & Coordinates
                        </h2>

                        <div className="space-y-4">
                            {data.event_type !== 'virtual' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-1">
                                        <Label htmlFor="venue_name">Venue / Building Name</Label>
                                        <Input
                                            id="venue_name"
                                            type="text"
                                            value={data.venue_name}
                                            onChange={(e) => setData('venue_name', e.target.value)}
                                            placeholder="e.g. Moscone Center"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <Label htmlFor="venue_address">Street Address</Label>
                                        <Input
                                            id="venue_address"
                                            type="text"
                                            value={data.venue_address}
                                            onChange={(e) => setData('venue_address', e.target.value)}
                                            placeholder="e.g. 747 Howard St"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <Label htmlFor="venue_city">City, State / Country</Label>
                                        <Input
                                            id="venue_city"
                                            type="text"
                                            value={data.venue_city}
                                            onChange={(e) => setData('venue_city', e.target.value)}
                                            placeholder="e.g. San Francisco, CA"
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>
                            )}

                            {data.event_type !== 'in-person' && (
                                <div>
                                    <Label htmlFor="virtual_meeting_url">Livestream / Virtual Meeting URL</Label>
                                    <Input
                                        id="virtual_meeting_url"
                                        type="url"
                                        value={data.virtual_meeting_url}
                                        onChange={(e) => setData('virtual_meeting_url', e.target.value)}
                                        placeholder="https://meetmind.ai/live/my-session"
                                        className="mt-1.5"
                                    />
                                    {errors.virtual_meeting_url && <p className="text-xs text-red-400 mt-1">{errors.virtual_meeting_url}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Schedule & Capacity */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 space-y-6">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber-500" />
                            Schedule & Capacity
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="starts_at">Start Date & Time *</Label>
                                <Input
                                    id="starts_at"
                                    type="datetime-local"
                                    value={data.starts_at}
                                    onChange={(e) => setData('starts_at', e.target.value)}
                                    className="mt-1.5"
                                    required
                                />
                                {errors.starts_at && <p className="text-xs text-red-400 mt-1">{errors.starts_at}</p>}
                            </div>

                            <div>
                                <Label htmlFor="ends_at">End Date & Time *</Label>
                                <Input
                                    id="ends_at"
                                    type="datetime-local"
                                    value={data.ends_at}
                                    onChange={(e) => setData('ends_at', e.target.value)}
                                    className="mt-1.5"
                                    required
                                />
                                {errors.ends_at && <p className="text-xs text-red-400 mt-1">{errors.ends_at}</p>}
                            </div>

                            <div>
                                <Label htmlFor="registration_deadline">Registration Deadline (Optional)</Label>
                                <Input
                                    id="registration_deadline"
                                    type="datetime-local"
                                    value={data.registration_deadline}
                                    onChange={(e) => setData('registration_deadline', e.target.value)}
                                    className="mt-1.5"
                                />
                                {errors.registration_deadline && <p className="text-xs text-red-400 mt-1">{errors.registration_deadline}</p>}
                            </div>

                            <div>
                                <Label htmlFor="capacity">Total Capacity (Max Attendees) *</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    min={1}
                                    max={100000}
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', parseInt(e.target.value) || 1)}
                                    className="mt-1.5"
                                    required
                                />
                                {errors.capacity && <p className="text-xs text-red-400 mt-1">{errors.capacity}</p>}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="status">Initial Status</Label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="published">Publish Immediately</option>
                                    <option value="draft">Save as Draft</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    id="is_featured"
                                    type="checkbox"
                                    checked={data.is_featured}
                                    onChange={(e) => setData('is_featured', e.target.checked)}
                                    className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                                />
                                <Label htmlFor="is_featured" className="text-sm font-medium cursor-pointer">
                                    Feature this event prominently on discovery homepage
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button asChild variant="outline" className="border-border/60">
                            <Link href="/organizer/events">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold px-8 shadow-sm"
                        >
                            {processing ? 'Creating Event...' : 'Create Event'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

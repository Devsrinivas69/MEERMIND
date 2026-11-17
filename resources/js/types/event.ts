import type { User } from './auth';

export type EventType = 'in-person' | 'virtual' | 'hybrid';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type EventCategory = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string;
    created_at?: string;
    updated_at?: string;
};

export type Event = {
    id: number;
    organizer_id: number;
    category_id: number | null;
    title: string;
    slug: string;
    summary: string | null;
    description: string;
    cover_image: string | null;
    event_type: EventType;
    venue_name: string | null;
    venue_address: string | null;
    venue_city: string | null;
    virtual_meeting_url: string | null;
    starts_at: string;
    ends_at: string;
    registration_deadline: string | null;
    capacity: number;
    registered_count: number;
    status: EventStatus;
    is_featured: boolean;
    ai_summary: string | null;
    ai_faqs: Array<{ question: string; answer: string }> | null;
    organizer?: User;
    category?: EventCategory | null;
    created_at: string;
    updated_at: string;
};

export type RegistrationStatus = 'confirmed' | 'cancelled' | 'waitlisted';

export type Registration = {
    id: number;
    event_id: number;
    user_id: number;
    status: RegistrationStatus;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    notes: string | null;
    event?: Event;
    user?: User;
    ticket?: Ticket | null;
    created_at: string;
    updated_at: string;
};

export type TicketStatus = 'valid' | 'used' | 'cancelled';

export type Ticket = {
    id: number;
    registration_id: number;
    ticket_code: string;
    qr_token: string;
    status: TicketStatus;
    checked_in_at: string | null;
    registration?: Registration;
    check_in?: CheckIn | null;
    created_at: string;
    updated_at: string;
};

export type CheckInMethod = 'qr_scan' | 'manual_code';

export type CheckIn = {
    id: number;
    ticket_id: number;
    event_id: number;
    checked_in_by: number | null;
    checked_in_at: string;
    method: CheckInMethod;
    device_info: string | null;
    notes: string | null;
    ticket?: Ticket;
    event?: Event;
    organizer?: User | null;
    created_at: string;
    updated_at: string;
};

export type Feedback = {
    id: number;
    event_id: number;
    user_id: number;
    rating: number;
    review_text: string;
    sentiment: 'positive' | 'neutral' | 'negative' | null;
    sentiment_score: number | null;
    highlights: string[] | null;
    user?: User;
    event?: Event;
    created_at: string;
    updated_at: string;
};

export type AiEventInsight = {
    id: number;
    event_id: number;
    insight_type: 'feedback_summary' | 'attendance_forecast' | 'recommendations';
    summary: string;
    sentiment_breakdown: {
        positive: number;
        neutral: number;
        negative: number;
        average_rating: number;
    } | null;
    key_themes: string[] | null;
    action_items: string[] | null;
    created_at: string;
    updated_at: string;
};

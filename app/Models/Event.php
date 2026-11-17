<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $organizer_id
 * @property int|null $category_id
 * @property string $title
 * @property string $slug
 * @property string|null $summary
 * @property string $description
 * @property string|null $cover_image
 * @property string $event_type
 * @property string|null $venue_name
 * @property string|null $venue_address
 * @property string|null $venue_city
 * @property string|null $virtual_meeting_url
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property Carbon|null $registration_deadline
 * @property int $capacity
 * @property int $registered_count
 * @property string $status
 * @property bool $is_featured
 * @property string|null $ai_summary
 * @property array<string, mixed>|null $ai_faqs
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'organizer_id',
    'category_id',
    'title',
    'slug',
    'summary',
    'description',
    'cover_image',
    'event_type',
    'venue_name',
    'venue_address',
    'venue_city',
    'virtual_meeting_url',
    'starts_at',
    'ends_at',
    'registration_deadline',
    'capacity',
    'registered_count',
    'status',
    'is_featured',
    'ai_summary',
    'ai_faqs',
])]
class Event extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_COMPLETED = 'completed';

    public const TYPE_IN_PERSON = 'in-person';

    public const TYPE_VIRTUAL = 'virtual';

    public const TYPE_HYBRID = 'hybrid';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'registration_deadline' => 'datetime',
            'capacity' => 'integer',
            'registered_count' => 'integer',
            'is_featured' => 'boolean',
            'ai_faqs' => 'array',
        ];
    }

    /**
     * Scope for published events.
     *
     * @param  Builder<Event>  $query
     * @return Builder<Event>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    /**
     * Scope for upcoming events.
     *
     * @param  Builder<Event>  $query
     * @return Builder<Event>
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('ends_at', '>=', now())->orderBy('starts_at', 'asc');
    }

    /**
     * Check if registration is open.
     */
    public function isRegistrationOpen(): bool
    {
        if ($this->status !== self::STATUS_PUBLISHED) {
            return false;
        }

        if ($this->registration_deadline && now()->greaterThan($this->registration_deadline)) {
            return false;
        }

        if (now()->greaterThan($this->starts_at)) {
            return false;
        }

        return $this->registered_count < $this->capacity;
    }

    /**
     * Check if the event has remaining capacity.
     */
    public function hasCapacity(): bool
    {
        return $this->registered_count < $this->capacity;
    }

    /**
     * Get remaining available capacity.
     */
    public function remainingCapacity(): int
    {
        return max(0, $this->capacity - $this->registered_count);
    }

    /**
     * The organizer of the event.
     *
     * @return BelongsTo<User, $this>
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    /**
     * The category of the event.
     *
     * @return BelongsTo<EventCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    /**
     * The registrations for this event.
     *
     * @return HasMany<Registration, $this>
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * Tickets issued for this event.
     *
     * @return HasManyThrough<Ticket, Registration, $this>
     */
    public function tickets(): HasManyThrough
    {
        return $this->hasManyThrough(Ticket::class, Registration::class);
    }

    /**
     * Check-ins recorded for this event.
     *
     * @return HasMany<CheckIn, $this>
     */
    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    /**
     * Attendee feedback submitted for this event.
     *
     * @return HasMany<Feedback, $this>
     */
    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    /**
     * AI insights generated for this event.
     *
     * @return HasMany<AiEventInsight, $this>
     */
    public function aiInsights(): HasMany
    {
        return $this->hasMany(AiEventInsight::class);
    }
}

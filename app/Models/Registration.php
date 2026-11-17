<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $event_id
 * @property int $user_id
 * @property string $status
 * @property Carbon|null $cancelled_at
 * @property string|null $cancellation_reason
 * @property string|null $notes
 * @property array<string, mixed>|null $answers
 * @property Carbon|null $application_submitted_at
 * @property Carbon|null $reviewed_at
 * @property int|null $reviewed_by
 * @property string|null $rejection_reason
 * @property string|null $review_notes
 * @property Carbon|null $approved_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'event_id',
    'user_id',
    'status',
    'cancelled_at',
    'cancellation_reason',
    'notes',
    'answers',
    'application_submitted_at',
    'reviewed_at',
    'reviewed_by',
    'rejection_reason',
    'review_notes',
    'approved_at',
])]
class Registration extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_WAITLISTED = 'waitlisted';

    public const STATUS_CANCELLED = 'cancelled';

    // Backward-compatibility alias
    public const STATUS_CONFIRMED = 'approved';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'application_submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'approved_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Check if registration is approved/confirmed.
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED || $this->status === 'confirmed';
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isWaitlisted(): bool
    {
        return $this->status === self::STATUS_WAITLISTED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isConfirmed(): bool
    {
        return $this->isApproved();
    }

    /**
     * Scopes
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_APPROVED, 'confirmed']);
    }

    public function scopeWaitlisted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_WAITLISTED);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    /**
     * The event associated with this registration.
     *
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * The user who registered.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The organizer who reviewed this application.
     *
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * The digital ticket for this registration.
     *
     * @return HasOne<Ticket, $this>
     */
    public function ticket(): HasOne
    {
        return $this->hasOne(Ticket::class);
    }
}

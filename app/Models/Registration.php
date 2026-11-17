<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
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
])]
class Registration extends Model
{
    use HasFactory;

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_WAITLISTED = 'waitlisted';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Check if registration is active/confirmed.
     */
    public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
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
     * The digital ticket for this registration.
     *
     * @return HasOne<Ticket, $this>
     */
    public function ticket(): HasOne
    {
        return $this->hasOne(Ticket::class);
    }
}

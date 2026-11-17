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
 * @property int $registration_id
 * @property string $ticket_code
 * @property string $qr_token
 * @property string $status
 * @property Carbon|null $checked_in_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'registration_id',
    'ticket_code',
    'qr_token',
    'status',
    'checked_in_at',
    'revoked_at',
    'revocation_reason',
])]
class Ticket extends Model
{
    use HasFactory;

    public const STATUS_VALID = 'valid';

    public const STATUS_USED = 'used';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REVOKED = 'revoked';

    public const STATUS_EXPIRED = 'expired';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /**
     * Check if the ticket can be checked in.
     */
    public function canCheckIn(): bool
    {
        return $this->status === self::STATUS_VALID && $this->checked_in_at === null;
    }

    /**
     * Check if the ticket has already been used.
     */
    public function isUsed(): bool
    {
        return $this->status === self::STATUS_USED || $this->checked_in_at !== null;
    }

    /**
     * Check if the ticket is valid.
     */
    public function isValid(): bool
    {
        return $this->status === self::STATUS_VALID && $this->checked_in_at === null;
    }

    /**
     * Check if the ticket is revoked.
     */
    public function isRevoked(): bool
    {
        return $this->status === self::STATUS_REVOKED;
    }

    /**
     * The registration linked to this ticket.
     *
     * @return BelongsTo<Registration, $this>
     */
    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    /**
     * The check-in record for this ticket.
     *
     * @return HasOne<CheckIn, $this>
     */
    public function checkIn(): HasOne
    {
        return $this->hasOne(CheckIn::class);
    }
}

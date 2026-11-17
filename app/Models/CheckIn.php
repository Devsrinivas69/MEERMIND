<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $ticket_id
 * @property int $event_id
 * @property int|null $checked_in_by
 * @property Carbon $checked_in_at
 * @property string $method
 * @property string|null $device_info
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'ticket_id',
    'event_id',
    'checked_in_by',
    'checked_in_at',
    'method',
    'device_info',
    'notes',
])]
class CheckIn extends Model
{
    use HasFactory;

    public const METHOD_QR_SCAN = 'qr_scan';

    public const METHOD_MANUAL_CODE = 'manual_code';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
        ];
    }

    /**
     * The ticket that was checked in.
     *
     * @return BelongsTo<Ticket, $this>
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * The event for which the check in happened.
     *
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * The organizer who validated the check in.
     *
     * @return BelongsTo<User, $this>
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $event_id
 * @property int $user_id
 * @property int $rating
 * @property string $review_text
 * @property string|null $sentiment
 * @property float|null $sentiment_score
 * @property array<string, mixed>|null $highlights
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'event_id',
    'user_id',
    'rating',
    'review_text',
    'sentiment',
    'sentiment_score',
    'highlights',
])]
class Feedback extends Model
{
    use HasFactory;

    protected $table = 'feedbacks';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'sentiment_score' => 'float',
            'highlights' => 'array',
        ];
    }

    /**
     * The event reviewed.
     *
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * The attendee who submitted feedback.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

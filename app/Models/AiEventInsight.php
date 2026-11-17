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
 * @property string $insight_type
 * @property string $summary
 * @property array<string, mixed>|null $sentiment_breakdown
 * @property array<string, mixed>|null $key_themes
 * @property array<string, mixed>|null $action_items
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'event_id',
    'insight_type',
    'summary',
    'sentiment_breakdown',
    'key_themes',
    'action_items',
])]
class AiEventInsight extends Model
{
    use HasFactory;

    public const TYPE_FEEDBACK_SUMMARY = 'feedback_summary';

    public const TYPE_ATTENDANCE_FORECAST = 'attendance_forecast';

    public const TYPE_RECOMMENDATIONS = 'recommendations';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sentiment_breakdown' => 'array',
            'key_themes' => 'array',
            'action_items' => 'array',
        ];
    }

    /**
     * The event associated with this insight.
     *
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}

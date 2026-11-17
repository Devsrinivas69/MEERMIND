<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $conversation_id
 * @property string $role
 * @property string $content
 * @property int|null $tokens_used
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'conversation_id',
    'role',
    'content',
    'tokens_used',
])]
class AiMessage extends Model
{
    use HasFactory;

    public const ROLE_USER = 'user';

    public const ROLE_ASSISTANT = 'assistant';

    public const ROLE_SYSTEM = 'system';

    /**
     * Parent conversation.
     *
     * @return BelongsTo<AiConversation, $this>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'conversation_id');
    }
}

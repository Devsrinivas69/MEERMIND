<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string|null $avatar
 * @property string|null $phone
 * @property string|null $company
 * @property string|null $job_title
 * @property string|null $bio
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'avatar', 'phone', 'company', 'job_title', 'bio'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    public const ROLE_ATTENDEE = 'attendee';

    public const ROLE_ORGANIZER = 'organizer';

    public const ROLE_ADMIN = 'admin';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Check if user is an organizer or admin.
     */
    public function isOrganizer(): bool
    {
        return in_array($this->role, [self::ROLE_ORGANIZER, self::ROLE_ADMIN], true);
    }

    /**
     * Check if user is an attendee.
     */
    public function isAttendee(): bool
    {
        return $this->role === self::ROLE_ATTENDEE;
    }

    /**
     * Check if user is a super admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Events organized by this user.
     *
     * @return HasMany<Event, $this>
     */
    public function organizedEvents(): HasMany
    {
        return $this->hasMany(Event::class, 'organizer_id');
    }

    /**
     * Registrations made by this user.
     *
     * @return HasMany<Registration, $this>
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * Feedback submitted by this user.
     *
     * @return HasMany<Feedback, $this>
     */
    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    /**
     * Check-ins performed by this user (as an organizer).
     *
     * @return HasMany<CheckIn, $this>
     */
    public function checkInsPerformed(): HasMany
    {
        return $this->hasMany(CheckIn::class, 'checked_in_by');
    }
}

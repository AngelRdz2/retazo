<?php

namespace App\Models;

use App\Enums\Sport;
use App\Enums\TeamStatus;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Sports\SportDefinition;
use Database\Factories\TournamentFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $slug
 * @property Sport $sport
 * @property string|null $variant
 * @property string|null $description
 * @property Carbon $start_date
 * @property string|null $location
 * @property TournamentFormat $format
 * @property TournamentStatus $status
 * @property bool $double_round
 * @property bool $public_registration
 * @property int|null $max_teams
 * @property array<string, mixed> $settings
 * @property list<string> $tiebreakers
 * @property string|null $scorer_invite_code
 * @property-read string $sport_label
 * @property-read string|null $variant_label
 * @property-read string $format_label
 * @property-read string $status_label
 */
#[Fillable([
    'name', 'slug', 'sport', 'variant', 'description', 'start_date', 'location', 'format',
    'status', 'double_round', 'public_registration', 'max_teams', 'settings', 'tiebreakers',
])]
#[Hidden(['scorer_invite_code'])]
#[Appends(['sport_label', 'variant_label', 'format_label', 'status_label'])]
class Tournament extends Model
{
    /** @use HasFactory<TournamentFactory> */
    use HasFactory;

    /**
     * Same defaults as the database, so a fresh model behaves the same before reloading.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'draft',
        'double_round' => false,
        'public_registration' => false,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sport' => Sport::class,
            'format' => TournamentFormat::class,
            'status' => TournamentStatus::class,
            'start_date' => 'date:Y-m-d',
            'double_round' => 'boolean',
            'public_registration' => 'boolean',
            'settings' => 'array',
            'tiebreakers' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Tournament $tournament) {
            $tournament->slug = static::uniqueSlug($tournament->slug ?: $tournament->name);
        });
    }

    /**
     * Slug for the public URL (/t/{slug}), with a numeric suffix when it is taken.
     */
    public static function uniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: 'torneo';
        $slug = $base;

        for ($i = 2; static::where('slug', $slug)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function scorers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tournament_scorers')->withTimestamps();
    }

    /**
     * @return HasMany<Team, $this>
     */
    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    /**
     * @return HasMany<Group, $this>
     */
    public function groups(): HasMany
    {
        return $this->hasMany(Group::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<Game, $this>
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }

    /**
     * @return HasMany<TournamentRule, $this>
     */
    public function rules(): HasMany
    {
        return $this->hasMany(TournamentRule::class)->orderBy('sort_order');
    }

    public function sportDefinition(): SportDefinition
    {
        return $this->sport->definition();
    }

    public function hasGames(): bool
    {
        return $this->games()->exists();
    }

    public function approvedTeamsCount(): int
    {
        return $this->teams()->where('status', TeamStatus::Approved)->count();
    }

    public function isFull(): bool
    {
        return $this->max_teams !== null && $this->approvedTeamsCount() >= $this->max_teams;
    }

    public function acceptsPublicRegistrations(): bool
    {
        return $this->public_registration
            && $this->status === TournamentStatus::RegistrationOpen
            && ! $this->isFull();
    }

    /**
     * @return Attribute<string, never>
     */
    protected function sportLabel(): Attribute
    {
        return Attribute::get(fn () => $this->sport->label());
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function variantLabel(): Attribute
    {
        return Attribute::get(fn () => $this->variant ? ($this->sportDefinition()->variants()[$this->variant] ?? null) : null);
    }

    /**
     * @return Attribute<string, never>
     */
    protected function formatLabel(): Attribute
    {
        return Attribute::get(fn () => $this->format->label());
    }

    /**
     * @return Attribute<string, never>
     */
    protected function statusLabel(): Attribute
    {
        return Attribute::get(fn () => $this->status->label());
    }

    public function isOrganizer(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    public function isScorer(User $user): bool
    {
        return $this->scorers()->whereKey($user->id)->exists();
    }
}

<?php

namespace App\Models;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Enums\Sport;
use App\Enums\TournamentStatus;
use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A match between two teams. Named "Game" because "match" is a reserved word in PHP.
 *
 * @property int $id
 * @property int $tournament_id
 * @property GameStage $stage
 * @property int|null $group_id
 * @property int $round
 * @property int|null $bracket_position
 * @property int|null $home_team_id
 * @property int|null $away_team_id
 * @property int|null $next_game_id
 * @property string|null $next_slot
 * @property Carbon|null $scheduled_at
 * @property string|null $venue
 * @property GameStatus $status
 * @property int $home_score
 * @property int $away_score
 * @property list<array{home: int, away: int}>|null $sets
 * @property int|null $home_penalties
 * @property int|null $away_penalties
 * @property int|null $winner_team_id
 * @property Carbon|null $started_at
 * @property Carbon|null $finished_at
 */
#[Fillable([
    'stage', 'group_id', 'round', 'bracket_position', 'home_team_id', 'away_team_id',
    'next_game_id', 'next_slot', 'scheduled_at', 'venue', 'status', 'home_score', 'away_score',
    'sets', 'home_penalties', 'away_penalties', 'winner_team_id', 'started_at', 'finished_at',
])]
class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stage' => GameStage::class,
            'status' => GameStatus::class,
            'sets' => 'array',
            // Wall-clock time of the venue, serialized without timezone (e.g. "2026-11-06T09:00").
            'scheduled_at' => 'datetime:Y-m-d\TH:i',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Tournament, $this>
     */
    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * @return BelongsTo<Group, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * @return BelongsTo<Team, $this>
     */
    public function homeTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    /**
     * @return BelongsTo<Team, $this>
     */
    public function awayTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    /**
     * @return BelongsTo<Team, $this>
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'winner_team_id');
    }

    /**
     * @return BelongsTo<Game, $this>
     */
    public function nextGame(): BelongsTo
    {
        return $this->belongsTo(Game::class, 'next_game_id');
    }

    /**
     * Knockout games whose winners feed into this one.
     *
     * @return HasMany<Game, $this>
     */
    public function previousGames(): HasMany
    {
        return $this->hasMany(Game::class, 'next_game_id');
    }

    public function isFinished(): bool
    {
        return $this->status === GameStatus::Finished;
    }

    /**
     * Games anyone can see: published tournaments and both teams known.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function listed(Builder $query, ?Sport $sport = null): void
    {
        $query->whereHas('tournament', fn (Builder $q) => $q
            ->whereNot('status', TournamentStatus::Draft)
            ->when($sport, fn (Builder $q) => $q->where('sport', $sport)))
            ->whereNotNull('home_team_id')
            ->whereNotNull('away_team_id')
            ->with(['homeTeam', 'awayTeam', 'tournament']);
    }

    /**
     * Live games first, then the scheduled ones by date.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function upcoming(Builder $query): void
    {
        $query->whereIn('status', [GameStatus::Live, GameStatus::Scheduled])
            ->orderByRaw('status = ? desc', [GameStatus::Live->value])
            ->orderBy('scheduled_at');
    }

    /**
     * Finished games, latest first.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function results(Builder $query): void
    {
        $query->where('status', GameStatus::Finished)->latest('finished_at');
    }
}

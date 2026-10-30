<?php

namespace App\Sports;

use App\Enums\Sport;

/**
 * Everything that changes from one sport to another: variants, default scoring,
 * whether draws exist and which columns the standings table shows.
 */
abstract class SportDefinition
{
    abstract public function sport(): Sport;

    abstract public function label(): string;

    /**
     * Default values stored in tournaments.settings when the tournament is created.
     *
     * @return array<string, mixed>
     */
    abstract public function defaultSettings(): array;

    /**
     * Labels for the editable keys of settings.points, in display order.
     *
     * @return array<string, string>
     */
    abstract public function pointLabels(): array;

    /**
     * Standings points earned by a team in a finished game.
     *
     * @param  int  $scored  Goals, points or sets won by the team.
     * @param  int  $conceded  Goals, points or sets won by the opponent.
     * @param  array<string, mixed>  $settings  The tournament settings.
     */
    abstract public function standingsPoints(int $scored, int $conceded, array $settings): int;

    /**
     * Standings columns (key => short header) in display order.
     *
     * @return array<string, string>
     */
    abstract public function standingsColumns(): array;

    /**
     * Name of what the score counts, e.g. "goles".
     */
    abstract public function scoreUnit(): string;

    /**
     * @return array<string, string>
     */
    public function variants(): array
    {
        return [];
    }

    public function allowsDraw(): bool
    {
        return false;
    }

    public function usesSets(): bool
    {
        return false;
    }

    /**
     * Points a team can add with one tap on the scoring screen.
     *
     * @return list<int>
     */
    public function scoreIncrements(): array
    {
        return [1];
    }

    /**
     * A knockout game that ends tied is decided by a penalty shoot-out.
     */
    public function decidesKnockoutTiesByPenalties(): bool
    {
        return false;
    }

    /**
     * Shape shared with the frontend forms and pages.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'value' => $this->sport()->value,
            'label' => $this->label(),
            'variants' => $this->variants(),
            'allowsDraw' => $this->allowsDraw(),
            'usesSets' => $this->usesSets(),
            'scoreIncrements' => $this->scoreIncrements(),
            'penaltiesInKnockout' => $this->decidesKnockoutTiesByPenalties(),
            'scoreUnit' => $this->scoreUnit(),
            'defaultSettings' => $this->defaultSettings(),
            'pointLabels' => $this->pointLabels(),
            'standingsColumns' => $this->standingsColumns(),
        ];
    }
}

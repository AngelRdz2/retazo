<?php

namespace App\Http\Requests;

use App\Enums\Sport;
use App\Enums\Tiebreaker;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Tournament;
use App\Sports\SportDefinition;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Create and update a tournament. Scoring fields depend on the chosen sport.
 */
class TournamentRequest extends FormRequest
{
    /**
     * Settings that shape the schedule and can't change once games exist.
     */
    private const LOCKED_AFTER_SCHEDULE = [
        'sport' => 'el deporte',
        'variant' => 'la variante',
        'format' => 'el formato',
        'double_round' => 'la ida y vuelta',
        'best_of' => 'la cantidad de sets',
        'groups_count' => 'la cantidad de grupos',
        'qualifiers_per_group' => 'los clasificados por grupo',
    ];

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $definition = $this->sportDefinition();
        $tournament = $this->tournament();
        $isGroups = $this->input('format') === TournamentFormat::GroupsKnockout->value;

        $rules = [
            'name' => ['required', 'string', 'max:100'],
            'slug' => $tournament
                ? ['required', 'string', 'max:100', 'alpha_dash:ascii', Rule::unique('tournaments', 'slug')->ignore($tournament->id)]
                : ['prohibited'],
            'sport' => ['required', Rule::enum(Sport::class)],
            'variant' => $definition?->variants()
                ? ['required', Rule::in(array_keys($definition->variants()))]
                : ['nullable'],
            'description' => ['nullable', 'string', 'max:2000'],
            'start_date' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:150'],
            'format' => ['required', Rule::enum(TournamentFormat::class)],
            'status' => ['required', Rule::enum(TournamentStatus::class)],
            'double_round' => ['boolean'],
            'public_registration' => ['boolean'],
            'max_teams' => ['nullable', 'integer', 'min:2', 'max:128'],
            'points' => ['required', 'array'],
            'best_of' => $definition?->usesSets() ? ['required', 'integer', Rule::in([3, 5])] : ['nullable'],
            'groups_count' => $isGroups ? ['required', 'integer', 'min:2', 'max:16'] : ['nullable'],
            'qualifiers_per_group' => $isGroups ? ['required', 'integer', 'min:1', 'max:4'] : ['nullable'],
            'tiebreakers' => ['required', 'array', 'min:1'],
            'tiebreakers.*' => ['distinct', Rule::enum(Tiebreaker::class)],
        ];

        foreach (array_keys($definition?->pointLabels() ?? []) as $key) {
            $rules["points.{$key}"] = ['required', 'integer', 'min:0', 'max:10'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'points.*' => 'puntos',
            'best_of' => 'sets por partido',
            'groups_count' => 'cantidad de grupos',
            'qualifiers_per_group' => 'clasificados por grupo',
            'tiebreakers' => 'criterios de desempate',
            'slug' => 'enlace público',
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $tournament = $this->tournament();

                if (! $tournament || $validator->errors()->isNotEmpty() || ! $tournament->hasGames()) {
                    return;
                }

                $current = [
                    ...$tournament->only(['variant', 'double_round']),
                    'sport' => $tournament->sport->value,
                    'format' => $tournament->format->value,
                    'best_of' => $tournament->settings['best_of'] ?? null,
                    'groups_count' => $tournament->settings['groups_count'] ?? null,
                    'qualifiers_per_group' => $tournament->settings['qualifiers_per_group'] ?? null,
                ];
                $new = $this->tournamentAttributes();
                $new = [...$new, ...$new['settings']];

                foreach (self::LOCKED_AFTER_SCHEDULE as $field => $label) {
                    if (($current[$field] ?? null) != ($new[$field] ?? null)) {
                        $validator->errors()->add($field, "No puedes cambiar {$label} porque el calendario ya fue generado.");
                    }
                }
            },
        ];
    }

    /**
     * Validated data mapped to the tournament columns.
     *
     * @return array<string, mixed>
     */
    public function tournamentAttributes(): array
    {
        $definition = $this->sportDefinition();
        $format = TournamentFormat::from($this->input('format'));

        $settings = ['points' => []];
        foreach (array_keys($definition->pointLabels()) as $key) {
            $settings['points'][$key] = (int) $this->input("points.{$key}");
        }
        if ($definition->usesSets()) {
            $settings['best_of'] = (int) $this->input('best_of');
        }
        if ($format === TournamentFormat::GroupsKnockout) {
            $settings['groups_count'] = (int) $this->input('groups_count');
            $settings['qualifiers_per_group'] = (int) $this->input('qualifiers_per_group');
        }

        $attributes = [
            ...$this->only(['name', 'description', 'start_date', 'location', 'max_teams']),
            'sport' => $definition->sport()->value,
            'variant' => $definition->variants() ? $this->input('variant') : null,
            'format' => $format->value,
            'status' => $this->input('status'),
            'double_round' => $format === TournamentFormat::League && $this->boolean('double_round'),
            'public_registration' => $this->boolean('public_registration'),
            'settings' => $settings,
            'tiebreakers' => array_values($this->input('tiebreakers', [])),
        ];

        if ($this->tournament()) {
            $attributes['slug'] = $this->input('slug');
        }

        return $attributes;
    }

    private function tournament(): ?Tournament
    {
        $tournament = $this->route('tournament');

        return $tournament instanceof Tournament ? $tournament : null;
    }

    private function sportDefinition(): ?SportDefinition
    {
        return Sport::tryFrom((string) $this->input('sport'))?->definition();
    }
}

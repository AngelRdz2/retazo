<?php

namespace App\Services;

use App\Enums\Sport;
use App\Models\RuleTemplate;
use App\Models\Tournament;
use Illuminate\Support\Facades\DB;

class TournamentRules
{
    /**
     * Replace the suggested rules with those of the tournament's sport and variant.
     * Custom rules written by the organizer are kept, after the suggested ones.
     */
    public function loadTemplates(Tournament $tournament): void
    {
        DB::transaction(function () use ($tournament) {
            $tournament->rules()->whereNotNull('template_key')->delete();

            $templates = RuleTemplate::query()->forSport($tournament->sport, $tournament->variant)->get();

            foreach ($templates as $order => $template) {
                $tournament->rules()->create([
                    'template_key' => $template->key,
                    'text' => $template->text,
                    'value' => $template->default_value,
                    'is_active' => true,
                    'sort_order' => $order,
                ]);
            }

            $tournament->rules()->whereNull('template_key')->get()
                ->each(fn ($rule, $i) => $rule->update(['sort_order' => $templates->count() + $i]));

            $this->syncWithSettings($tournament);
        });
    }

    /**
     * Keep rules that mirror a tournament setting (volleyball "best of") in sync.
     */
    public function syncWithSettings(Tournament $tournament): void
    {
        if ($tournament->sport === Sport::Volleyball) {
            $tournament->rules()->where('template_key', 'best_of')
                ->update(['value' => (string) ($tournament->settings['best_of'] ?? 3)]);
        }
    }

    /**
     * Save the rules page: toggles and values of every rule, plus custom rules
     * (added, edited or removed). The submitted order becomes the display order.
     *
     * @param  list<array{id: int|null, text: string|null, value: string|null, is_active: bool}>  $rules
     */
    public function save(Tournament $tournament, array $rules): void
    {
        DB::transaction(function () use ($tournament, $rules) {
            $existing = $tournament->rules()->get()->keyBy('id');
            $keptIds = [];

            foreach ($rules as $order => $data) {
                $rule = $data['id'] ? $existing->get($data['id']) : null;

                if ($rule) {
                    $rule->fill([
                        'value' => $data['value'],
                        'is_active' => $data['is_active'],
                        'sort_order' => $order,
                    ]);

                    // Only custom rules can change their text.
                    if ($rule->template_key === null) {
                        $rule->text = (string) $data['text'];
                    }

                    $rule->save();
                    $keptIds[] = $rule->id;
                } else {
                    $keptIds[] = $tournament->rules()->create([
                        'text' => (string) $data['text'],
                        'is_active' => $data['is_active'],
                        'sort_order' => $order,
                    ])->id;
                }
            }

            // Custom rules left out of the form were removed by the organizer.
            $tournament->rules()->whereNull('template_key')->whereNotIn('id', $keptIds)->delete();

            $this->syncWithSettings($tournament);
        });
    }
}

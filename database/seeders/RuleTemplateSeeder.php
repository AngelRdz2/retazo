<?php

namespace Database\Seeders;

use App\Enums\Sport;
use App\Models\RuleTemplate;
use Illuminate\Database\Seeder;

/**
 * Suggested rules loaded into every new tournament of each sport.
 * "{value}" marks the part the organizer can edit.
 */
class RuleTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $this->seed(Sport::Football, $this->football());
        $this->seed(Sport::Volleyball, $this->volleyball());
        $this->seed(Sport::Basketball, $this->basketball());
    }

    /**
     * @param  list<array{key: string, text: string, value?: string, variant?: string}>  $rules
     */
    private function seed(Sport $sport, array $rules): void
    {
        foreach ($rules as $order => $rule) {
            RuleTemplate::updateOrCreate(
                ['sport' => $sport, 'variant' => $rule['variant'] ?? null, 'key' => $rule['key']],
                ['text' => $rule['text'], 'default_value' => $rule['value'] ?? null, 'sort_order' => $order],
            );
        }
    }

    /**
     * @return list<array{key: string, text: string, value?: string, variant?: string}>
     */
    private function football(): array
    {
        return [
            ['key' => 'half_duration', 'variant' => 'f11', 'text' => 'Dos tiempos de {value} minutos', 'value' => '45'],
            ['key' => 'half_duration', 'variant' => 'f7', 'text' => 'Dos tiempos de {value} minutos', 'value' => '25'],
            ['key' => 'half_duration', 'variant' => 'f5', 'text' => 'Dos tiempos de {value} minutos', 'value' => '20'],
            ['key' => 'tolerance', 'text' => 'Tolerancia de {value} minutos para presentarse; después se pierde el partido', 'value' => '10'],
            ['key' => 'min_players', 'variant' => 'f11', 'text' => 'Mínimo de {value} jugadores para iniciar el partido', 'value' => '7'],
            ['key' => 'min_players', 'variant' => 'f7', 'text' => 'Mínimo de {value} jugadores para iniciar el partido', 'value' => '5'],
            ['key' => 'min_players', 'variant' => 'f5', 'text' => 'Mínimo de {value} jugadores para iniciar el partido', 'value' => '4'],
            ['key' => 'red_card', 'text' => 'Tarjeta roja: suspensión para el siguiente partido'],
            ['key' => 'yellow_cards', 'text' => 'Acumular {value} tarjetas amarillas: suspensión de un partido', 'value' => '3'],
            ['key' => 'knockout_penalties', 'text' => 'En eliminatoria, si el partido termina empatado se define por penales'],
        ];
    }

    /**
     * @return list<array{key: string, text: string, value?: string, variant?: string}>
     */
    private function volleyball(): array
    {
        return [
            ['key' => 'set_points', 'text' => 'Los sets se juegan a {value} puntos', 'value' => '25'],
            ['key' => 'deciding_set_points', 'text' => 'El set decisivo se juega a {value} puntos', 'value' => '15'],
            ['key' => 'point_difference', 'text' => 'Cada set se gana con una diferencia mínima de {value} puntos', 'value' => '2'],
            ['key' => 'best_of', 'text' => 'Partidos a mejor de {value} sets', 'value' => '3'],
            ['key' => 'tolerance', 'text' => 'Tolerancia de {value} minutos para presentarse; después se pierde el partido', 'value' => '10'],
            ['key' => 'min_players', 'text' => 'Mínimo de {value} jugadores para iniciar el partido', 'value' => '4'],
        ];
    }

    /**
     * @return list<array{key: string, text: string, value?: string, variant?: string}>
     */
    private function basketball(): array
    {
        return [
            ['key' => 'quarter_duration', 'text' => 'Cuatro cuartos de {value} minutos', 'value' => '10'],
            ['key' => 'foul_limit', 'text' => 'Un jugador sale del partido al cometer {value} faltas personales', 'value' => '5'],
            ['key' => 'overtime', 'text' => 'Si el partido termina empatado se juega tiempo extra de {value} minutos', 'value' => '5'],
            ['key' => 'tolerance', 'text' => 'Tolerancia de {value} minutos para presentarse; después se pierde el partido', 'value' => '10'],
            ['key' => 'min_players', 'text' => 'Mínimo de {value} jugadores para iniciar el partido', 'value' => '5'],
        ];
    }
}

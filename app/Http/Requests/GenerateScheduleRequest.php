<?php

namespace App\Http\Requests;

use App\Services\Scheduling\ScheduleOptions;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GenerateScheduleRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date_format:Y-m-d\TH:i'],
            'game_minutes' => ['required', 'integer', 'min:10', 'max:300'],
            'courts' => ['required', 'integer', 'min:1', 'max:20'],
            'court_names' => ['nullable', 'string', 'max:500'],
            'days_between_rounds' => ['required', 'integer', 'min:0', 'max:60'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'starts_at' => 'fecha y hora del primer partido',
            'game_minutes' => 'duración de cada partido',
            'courts' => 'canchas',
            'court_names' => 'nombres de las canchas',
            'days_between_rounds' => 'días entre jornadas',
        ];
    }

    public function options(): ScheduleOptions
    {
        // "Norte, Sur" → one court per name.
        $names = array_values(array_filter(array_map('trim', preg_split('/[,\n]/', (string) $this->input('court_names')) ?: [])));

        return new ScheduleOptions(
            startsAt: CarbonImmutable::createFromFormat('Y-m-d\TH:i', $this->input('starts_at')) ?: CarbonImmutable::now(),
            gameMinutes: $this->integer('game_minutes'),
            courts: $names !== [] ? count($names) : $this->integer('courts'),
            courtNames: $names,
            daysBetweenRounds: $this->integer('days_between_rounds'),
        );
    }
}

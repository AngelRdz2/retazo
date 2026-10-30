<?php

namespace App\Http\Requests;

use App\Models\Team;
use App\Models\Tournament;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Team created or edited by the organizer.
 */
class TeamRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Tournament $tournament */
        $tournament = $this->route('tournament');
        $team = $this->route('team');

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('teams')->where('tournament_id', $tournament->id)->ignore($team instanceof Team ? $team->id : null),
            ],
            'color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'logo' => ['nullable', 'image', 'max:1024'],
            'remove_logo' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'Ya hay un equipo con ese nombre en el torneo.',
            'color.regex' => 'Elige un color válido.',
        ];
    }
}

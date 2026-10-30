<?php

namespace App\Http\Requests;

use App\Models\Tournament;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Team registration from the public link (no login). The team stays pending.
 */
class PublicTeamRegistrationRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('teams')->where('tournament_id', $this->tournament()->id),
            ],
            'color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'contact_name' => ['required', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'Ya hay un equipo inscrito con ese nombre.',
            'color.regex' => 'Elige un color válido.',
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if (! $this->tournament()->acceptsPublicRegistrations()) {
                    $validator->errors()->add('name', 'Las inscripciones de este torneo están cerradas.');
                }
            },
        ];
    }

    private function tournament(): Tournament
    {
        /** @var Tournament */
        return $this->route('tournament');
    }
}

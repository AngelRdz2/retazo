<?php

namespace App\Http\Requests;

use App\Models\Tournament;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreScorerRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                /** @var Tournament $tournament */
                $tournament = $this->route('tournament');
                $user = $this->scorer();

                $error = match (true) {
                    $user === null => 'No hay ningún usuario registrado con ese correo. Pídele que cree su cuenta o compártele el enlace de invitación.',
                    $tournament->isOrganizer($user) => 'Ya eres el organizador de este torneo.',
                    $tournament->isScorer($user) => 'Esa persona ya es anotadora del torneo.',
                    default => null,
                };

                if ($error) {
                    $validator->errors()->add('email', $error);
                }
            },
        ];
    }

    public function scorer(): ?User
    {
        return User::where('email', $this->input('email'))->first();
    }
}

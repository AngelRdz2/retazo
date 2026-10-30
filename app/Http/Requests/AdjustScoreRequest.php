<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AdjustScoreRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'side' => ['required', 'in:home,away'],
            // The allowed increments per sport are checked by GameScoring.
            'delta' => ['required', 'integer', 'in:-1,1,2,3'],
        ];
    }

    /**
     * @return 'home'|'away'
     */
    public function side(): string
    {
        return $this->input('side') === 'away' ? 'away' : 'home';
    }
}

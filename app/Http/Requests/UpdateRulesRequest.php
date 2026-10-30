<?php

namespace App\Http\Requests;

use App\Models\Tournament;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateRulesRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rules' => ['present', 'array', 'max:50'],
            'rules.*.id' => ['nullable', 'integer'],
            'rules.*.text' => ['nullable', 'string', 'max:500'],
            'rules.*.value' => ['nullable', 'string', 'max:50'],
            'rules.*.is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                /** @var Tournament $tournament */
                $tournament = $this->route('tournament');
                $suggestedIds = $tournament->rules()->whereNotNull('template_key')->pluck('id')->all();

                foreach ($this->input('rules', []) as $i => $rule) {
                    $isCustom = ! in_array($rule['id'] ?? null, $suggestedIds);

                    if ($isCustom && blank($rule['text'] ?? null)) {
                        $validator->errors()->add("rules.{$i}.text", 'Escribe el texto de la regla.');
                    }
                }
            },
        ];
    }

    /**
     * @return list<array{id: int|null, text: string|null, value: string|null, is_active: bool}>
     */
    public function rulesData(): array
    {
        return array_map(fn (array $rule) => [
            'id' => isset($rule['id']) ? (int) $rule['id'] : null,
            'text' => isset($rule['text']) ? trim($rule['text']) : null,
            'value' => isset($rule['value']) ? trim($rule['value']) : null,
            'is_active' => filter_var($rule['is_active'], FILTER_VALIDATE_BOOLEAN),
        ], array_values($this->validated('rules')));
    }
}

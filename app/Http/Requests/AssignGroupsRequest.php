<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AssignGroupsRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assignments' => ['required', 'array'],
            'assignments.*' => ['nullable', 'integer'],
        ];
    }

    /**
     * @return array<int, int|null>
     */
    public function assignments(): array
    {
        $assignments = [];
        foreach ($this->input('assignments', []) as $teamId => $groupId) {
            $assignments[(int) $teamId] = $groupId === null ? null : (int) $groupId;
        }

        return $assignments;
    }
}

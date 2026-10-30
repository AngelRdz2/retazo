<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A rule of a tournament. The text may contain a "{value}" placeholder,
 * e.g. "Tolerancia de {value} minutos para presentarse".
 *
 * @property int $id
 * @property int $tournament_id
 * @property string|null $template_key
 * @property string $text
 * @property string|null $value
 * @property bool $is_active
 * @property int $sort_order
 * @property-read string $display_text
 */
#[Fillable(['template_key', 'text', 'value', 'is_active', 'sort_order'])]
#[Appends(['display_text'])]
class TournamentRule extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Tournament, $this>
     */
    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * @return Attribute<string, never>
     */
    protected function displayText(): Attribute
    {
        return Attribute::get(fn () => str_replace('{value}', (string) $this->value, $this->text));
    }
}

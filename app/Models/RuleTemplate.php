<?php

namespace App\Models;

use App\Enums\Sport;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Suggested rule for a sport (and optionally a variant), seeded by RuleTemplateSeeder.
 *
 * @property int $id
 * @property Sport $sport
 * @property string|null $variant
 * @property string $key
 * @property string $text
 * @property string|null $default_value
 * @property int $sort_order
 */
#[Fillable(['sport', 'variant', 'key', 'text', 'default_value', 'sort_order'])]
class RuleTemplate extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sport' => Sport::class,
        ];
    }

    /**
     * Templates that apply to a sport: the generic ones plus those of the given variant.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function forSport(Builder $query, Sport $sport, ?string $variant = null): void
    {
        $query->where('sport', $sport)
            ->where(fn (Builder $q) => $q->whereNull('variant')->orWhere('variant', $variant))
            ->orderBy('sort_order');
    }
}

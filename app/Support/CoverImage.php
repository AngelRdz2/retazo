<?php

namespace App\Support;

/**
 * Optional photos for the public pages: drop them in public/images/portada
 * (e.g. estadio.jpg) and they replace the drawn backgrounds.
 */
class CoverImage
{
    public static function find(string $name): ?string
    {
        foreach (['webp', 'jpg', 'jpeg', 'png'] as $extension) {
            if (is_file(public_path("images/portada/{$name}.{$extension}"))) {
                return asset("images/portada/{$name}.{$extension}");
            }
        }

        return null;
    }
}

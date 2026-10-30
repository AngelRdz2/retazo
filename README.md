# Retazo

Organizador de torneos deportivos amateur de fútbol, vóley y básquet, pensado primero para el teléfono.

Laravel 13 + Inertia 3 + React + TypeScript + Tailwind, con MySQL.

## Puesta en marcha (local con Herd)

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm run build
herd link retazo
```

La app queda en http://retazo.test. Para desarrollar con recarga automática: `composer run dev`.

`php artisan db:seed` carga las reglas sugeridas por deporte y tres torneos de ejemplo
(se puede volver a correr sin duplicar nada):

| Torneo                      | Deporte                        | Estado                           |
| --------------------------- | ------------------------------ | -------------------------------- |
| Liga Colonia 2026           | Fútbol 7, liga                 | En curso, con un partido en vivo |
| Copa Vóley Primavera        | Vóley, grupos + eliminatoria   | Final pendiente                  |
| Torneo Relámpago de Básquet | Básquet, eliminatoria con byes | Finalizado                       |

Cuentas de prueba (contraseña `password`):

- `demo@retazo.test`: organizador de los tres torneos.
- `anotador@retazo.test`: anotador de la Liga Colonia.

## Dónde está cada cosa

- `app/Enums/Sport.php` y `app/Sports/*`: los deportes. Para agregar uno: un caso en el enum,
  su clase `SportDefinition` y sus reglas en `database/seeders/RuleTemplateSeeder.php`.
- `app/Services/Scheduling/*`: calendarios (liga, eliminatoria, grupos, horarios y canchas).
- `app/Services/StandingsCalculator.php`: tabla de posiciones con desempates.
- `app/Services/GameScoring.php` y `KnockoutAdvancer.php`: anotación en vivo y avance en el cuadro.
- `app/Policies/*`: permisos de organizador y anotadores.
- `resources/js/pages/public/*`: páginas públicas (sin login).

## Calidad

```bash
php artisan test
vendor/bin/phpstan analyse
vendor/bin/pint
npx vp check
```

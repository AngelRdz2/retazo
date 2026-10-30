<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

/**
 * After logging in (or signing up), Laravel goes back to the page that asked for it.
 * When that page isn't for this account (e.g. the scoring page of someone else's
 * tournament, left open in another session), the account lands on its panel instead
 * of a "forbidden" error.
 */
class ForgetForbiddenIntendedUrl
{
    public function __construct(private Request $request, private Router $router) {}

    public function handle(Login $event): void
    {
        if (! $this->request->hasSession()) {
            return;
        }

        $intended = $this->request->session()->get('url.intended');

        if (! is_string($intended) || $this->canOpen($event->user, $intended)) {
            return;
        }

        $this->request->session()->forget('url.intended');
        Inertia::flash('toast', [
            'type' => 'info',
            'message' => 'Tu cuenta no tiene acceso a la página que intentabas abrir, así que te trajimos a tu panel.',
        ]);
    }

    /**
     * Whether the user passes the `can:` checks of the route behind the URL.
     */
    private function canOpen(Authenticatable $user, string $url): bool
    {
        try {
            $route = $this->router->getRoutes()->match(Request::create($url));
            $this->router->substituteBindings($route);
            $this->router->substituteImplicitBindings($route);
        } catch (HttpExceptionInterface|ModelNotFoundException) {
            return false;
        }

        foreach ($route->gatherMiddleware() as $middleware) {
            if (! is_string($middleware) || ! str_starts_with($middleware, 'can:')) {
                continue;
            }

            [$ability, $parameters] = array_pad(explode(',', substr($middleware, 4), 2), 2, '');
            $arguments = array_map(
                fn (string $name) => $route->parameter($name) ?? $name,
                array_values(array_filter(explode(',', $parameters))),
            );

            if (Gate::forUser($user)->denies($ability, $arguments)) {
                return false;
            }
        }

        return true;
    }
}

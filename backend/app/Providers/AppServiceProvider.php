<?php

namespace App\Providers;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Appointments\AppointmentStatusWorkflow;
use App\Infrastructure\Cache\CacheManager;
use App\Services\Notifications\NullSmsProvider;
use App\Services\Notifications\SmsProviderInterface;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\PermissionRegistrar;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(NotificationDispatcher::class);
        $this->app->alias(NotificationDispatcher::class, 'notifications.dispatcher');
        $this->app->bind(SmsProviderInterface::class, NullSmsProvider::class);
        $this->app->singleton(AppointmentStatusWorkflow::class);

        // Registrar CacheManager como singleton
        $this->app->singleton(CacheManager::class, function ($app) {
            return new CacheManager;
        });

        // Registrar serviços de Appointment
        $this->app->singleton(\App\Application\Appointments\AppointmentCreationService::class);
        $this->app->singleton(\App\Application\Appointments\AppointmentValidationService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Usar Redis para cache em todos os ambientes (configurado via .env)
        // Anteriormente forçava 'array' em desenvolvimento, mas isso causava problemas
        // com invalidação de cache entre requisições

        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Limpa o cache do Spatie Permission ao iniciar
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(5)->by($request->input('email').$request->ip()),
            ];
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        Password::defaults(function () {
            return Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols();
        });
    }
}

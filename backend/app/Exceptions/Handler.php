<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        ValidationException::class,
        AuthenticationException::class,
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Log estruturado para monitoramento
            if ($this->shouldReport($e)) {
                \Log::error('Exception occurred', [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function render($request, Throwable $e)
    {
        // API requests retornam JSON
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions
     */
    protected function handleApiException(Request $request, Throwable $e): JsonResponse
    {
        return match (true) {
            $e instanceof ValidationException => $this->handleValidationException($e),
            $e instanceof AuthenticationException => $this->handleAuthenticationException($e),
            $e instanceof NotFoundHttpException => $this->handleNotFoundException($e),
            $e instanceof MethodNotAllowedHttpException => $this->handleMethodNotAllowedException($e),
            $e instanceof TooManyRequestsHttpException => $this->handleTooManyRequestsException($e),
            $e instanceof QueryException => $this->handleQueryException($e),
            default => $this->handleGenericException($e),
        };
    }

    /**
     * Handle validation exceptions
     */
    protected function handleValidationException(ValidationException $e): JsonResponse
    {
        return response()->json([
            'message' => __('Os dados fornecidos são inválidos.'),
            'errors' => $e->errors(),
        ], 422);
    }

    /**
     * Handle authentication exceptions
     */
    protected function handleAuthenticationException(AuthenticationException $e): JsonResponse
    {
        return response()->json([
            'message' => __('Não autenticado.'),
        ], 401);
    }

    /**
     * Handle not found exceptions
     */
    protected function handleNotFoundException(NotFoundHttpException $e): JsonResponse
    {
        return response()->json([
            'message' => __('Recurso não encontrado.'),
        ], 404);
    }

    /**
     * Handle method not allowed exceptions
     */
    protected function handleMethodNotAllowedException(MethodNotAllowedHttpException $e): JsonResponse
    {
        return response()->json([
            'message' => __('Método não permitido para este endpoint.'),
        ], 405);
    }

    /**
     * Handle too many requests exceptions
     */
    protected function handleTooManyRequestsException(TooManyRequestsHttpException $e): JsonResponse
    {
        return response()->json([
            'message' => __('Muitas requisições. Aguarde um momento.'),
        ], 429);
    }

    /**
     * Handle database query exceptions
     */
    protected function handleQueryException(QueryException $e): JsonResponse
    {
        // Não expor detalhes do banco em produção
        $message = app()->environment('production')
            ? __('Erro ao processar requisição.')
            : $e->getMessage();

        return response()->json([
            'message' => $message,
        ], 500);
    }

    /**
     * Handle generic exceptions
     */
    protected function handleGenericException(Throwable $e): JsonResponse
    {
        $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

        $response = [
            'message' => __('Erro ao processar requisição.'),
        ];

        // Em desenvolvimento, incluir mais detalhes
        if (app()->environment(['local', 'testing'])) {
            $response['error'] = $e->getMessage();
            $response['file'] = $e->getFile();
            $response['line'] = $e->getLine();
        }

        return response()->json($response, $statusCode);
    }
}

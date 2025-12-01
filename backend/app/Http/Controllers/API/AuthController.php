<?php

namespace App\Http\Controllers\API;

use App\Application\Auth\AuthService;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterDoctorRequest;
use App\Http\Requests\Auth\RegisterPatientRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Autenticação')]
class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    #[OA\Post(
        path: '/auth/login',
        summary: 'Realizar login',
        description: 'Autentica um usuário e retorna um token de acesso. Após 3 tentativas falhas, a conta é bloqueada por 30 minutos.',
        tags: ['Autenticação'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'paciente@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'senha123'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login realizado com sucesso',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'token', type: 'string', example: '1|abcdef123456...'),
                        new OA\Property(property: 'user', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Credenciais inválidas'),
            new OA\Response(response: 429, description: 'Muitas tentativas. Conta bloqueada temporariamente'),
        ]
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $payload = $this->authService->login(
            $request->input('email'),
            $request->input('password')
        );

        return response()->json([
            'token' => $payload['token'],
            'user' => $payload['user'],
        ]);
    }

    #[OA\Get(
        path: '/auth/me',
        summary: 'Obter usuário autenticado',
        description: 'Retorna os dados completos do usuário autenticado incluindo relacionamentos',
        tags: ['Autenticação'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dados do usuário',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
        ]
    )]
    public function me(): JsonResponse
    {
        return response()->json(
            Auth::user()->load(['patient.healthInsurances', 'doctor.healthInsurances'])
        );
    }

    #[OA\Post(
        path: '/auth/logout',
        summary: 'Encerrar sessão',
        description: 'Invalida o token de autenticação atual',
        tags: ['Autenticação'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sessão encerrada com sucesso',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Sessão encerrada com sucesso.'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
        ]
    )]
    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return response()->json([
            'message' => __('Sessão encerrada com sucesso.'),
        ]);
    }

    #[OA\Post(
        path: '/auth/register',
        summary: 'Registrar novo paciente',
        description: 'Cria uma nova conta de paciente no sistema',
        tags: ['Autenticação'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password', 'cpf', 'birth_date'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'João Silva'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'joao@example.com'),
                    new OA\Property(property: 'phone', type: 'string', example: '(11) 99999-9999'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'senha123'),
                    new OA\Property(property: 'cpf', type: 'string', example: '123.456.789-00'),
                    new OA\Property(property: 'birth_date', type: 'string', format: 'date', example: '1990-01-15'),
                    new OA\Property(property: 'gender', type: 'string', enum: ['M', 'F', 'OTHER']),
                    new OA\Property(property: 'address', type: 'string', example: 'Rua Exemplo, 123'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Paciente registrado com sucesso',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Dados inválidos'),
        ]
    )]
    public function register(RegisterPatientRequest $request): JsonResponse
    {
        $result = $this->authService->registerPatient($request->validated());

        return response()->json([
            'message' => __('Conta criada com sucesso.'),
            'user' => $result['user'],
            'token' => $result['token'],
        ], 201);
    }

    #[OA\Post(
        path: '/auth/register/doctor',
        summary: 'Registrar novo médico',
        description: 'Cria uma nova conta de médico no sistema',
        tags: ['Autenticação'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password', 'crm', 'specialty'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Dr. João Silva'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'joao@example.com'),
                    new OA\Property(property: 'phone', type: 'string', example: '(11) 99999-9999'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'senha123'),
                    new OA\Property(property: 'crm', type: 'string', example: '12345-SP'),
                    new OA\Property(property: 'specialty', type: 'string', example: 'Cardiologia'),
                    new OA\Property(property: 'qualification', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Médico registrado com sucesso',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Dados inválidos'),
        ]
    )]
    public function registerDoctor(RegisterDoctorRequest $request): JsonResponse
    {
        $user = $this->authService->registerDoctor($request->validated());

        return response()->json([
            'message' => __('Conta criada com sucesso. Você já pode fazer login.'),
            'user' => $user,
        ], 201);
    }

    #[OA\Post(
        path: '/auth/check-availability',
        summary: 'Verificar disponibilidade de email/CPF',
        description: 'Verifica se um email ou CPF já está cadastrado no sistema',
        tags: ['Autenticação'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'joao@example.com'),
                    new OA\Property(property: 'cpf', type: 'string', example: '12345678900'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Resultado da verificação',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'email_available', type: 'boolean'),
                        new OA\Property(property: 'cpf_available', type: 'boolean'),
                    ]
                )
            ),
        ]
    )]
    public function checkAvailability(\Illuminate\Http\Request $request): JsonResponse
    {
        $result = [];

        if ($request->has('email')) {
            $result['email_available'] = !\App\Models\User::where('email', $request->email)->exists();
        }

        if ($request->has('cpf')) {
            $cpf = preg_replace('/\D/', '', $request->cpf);
            $result['cpf_available'] = !\App\Models\Patient::where('cpf', $cpf)->exists();
        }

        return response()->json($result);
    }
}

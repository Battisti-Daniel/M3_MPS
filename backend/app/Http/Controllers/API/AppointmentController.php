<?php

namespace App\Http\Controllers\API;

use App\Application\Appointments\AppointmentService;
use App\Domain\Shared\Enums\UserRole;
use App\Http\Requests\Appointments\AdminCreateAppointmentRequest;
use App\Http\Requests\Appointments\CreateAppointmentRequest;
use App\Http\Requests\Appointments\RescheduleAppointmentRequest;
use App\Http\Requests\Appointments\UpdateAppointmentStatusRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Consultas')]
class AppointmentController extends Controller
{
    public function __construct(private AppointmentService $service)
    {
        $this->middleware('auth:sanctum');
    }

    #[OA\Get(
        path: '/appointments',
        summary: 'Listar consultas',
        description: 'Lista consultas do usuário autenticado. Retorna consultas diferentes conforme o perfil: paciente vê suas consultas, médico vê suas consultas, admin vê todas.',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'status',
                in: 'query',
                description: 'Filtrar por status',
                required: false,
                schema: new OA\Schema(type: 'string', enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
            ),
            new OA\Parameter(
                name: 'period',
                in: 'query',
                description: 'Filtrar por período: future (futuras), past (passadas), all (todas)',
                required: false,
                schema: new OA\Schema(type: 'string', enum: ['future', 'past', 'all'])
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                description: 'Itens por página',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 10)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de consultas paginada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $role = $this->resolveRole($user);

        if ($role === UserRole::PATIENT) {
            $appointments = $this->service->listForPatient($user, $request->all());
        } elseif ($role === UserRole::DOCTOR) {
            $appointments = $this->service->listForDoctor($user, $request->all());
        } elseif ($role === UserRole::ADMIN) {
            $appointments = $this->service->listForAdmin($request->all());
        } else {
            return response()->json(['message' => __('Função não suportada para este usuário.')], 403);
        }

        return AppointmentResource::collection($appointments)->response();
    }

    #[OA\Post(
        path: '/appointments',
        summary: 'Agendar consulta',
        description: 'Cria um novo agendamento de consulta. Requer antecedência mínima de 24h, perfil completo do paciente e médico ativo.',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['doctor_id', 'scheduled_at'],
                properties: [
                    new OA\Property(property: 'doctor_id', type: 'integer', example: 1),
                    new OA\Property(property: 'scheduled_at', type: 'string', format: 'date-time', example: '2025-12-01 14:00:00'),
                    new OA\Property(property: 'duration_minutes', type: 'integer', example: 30),
                    new OA\Property(property: 'type', type: 'string', example: 'PRESENTIAL'),
                    new OA\Property(property: 'price', type: 'number', format: 'float', example: 150.00),
                    new OA\Property(property: 'notes', type: 'string', example: 'Consulta de rotina'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Consulta agendada com sucesso',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Dados inválidos ou regras de negócio violadas'),
        ]
    )]
    public function store(CreateAppointmentRequest $request): JsonResponse
    {
        $appointment = $this->service->createForPatient($request->user(), $request->validated());

        return (new AppointmentResource($appointment))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Post(
        path: '/admin/appointments',
        summary: 'Criar consulta (Admin)',
        description: 'Cria um novo agendamento de consulta como administrador, permitindo selecionar paciente e médico.',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['patient_id', 'doctor_id', 'scheduled_at'],
                properties: [
                    new OA\Property(property: 'patient_id', type: 'integer', example: 1),
                    new OA\Property(property: 'doctor_id', type: 'integer', example: 1),
                    new OA\Property(property: 'scheduled_at', type: 'string', format: 'date-time', example: '2025-12-01 14:00:00'),
                    new OA\Property(property: 'duration_minutes', type: 'integer', example: 30),
                    new OA\Property(property: 'type', type: 'string', example: 'PRESENTIAL'),
                    new OA\Property(property: 'price', type: 'number', format: 'float', example: 150.00),
                    new OA\Property(property: 'notes', type: 'string', example: 'Consulta de rotina'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Consulta agendada com sucesso',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Dados inválidos ou regras de negócio violadas'),
        ]
    )]
    public function storeAsAdmin(AdminCreateAppointmentRequest $request): JsonResponse
    {
        $appointment = $this->service->createForAdmin($request->user(), $request->validated());

        return (new AppointmentResource($appointment))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Get(
        path: '/appointments/{id}',
        summary: 'Obter detalhes da consulta',
        description: 'Retorna os detalhes completos de uma consulta incluindo médico, paciente, observações e logs',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'ID da consulta',
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Detalhes da consulta',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Não autorizado para esta consulta'),
            new OA\Response(response: 404, description: 'Consulta não encontrada'),
        ]
    )]
    public function show(Appointment $appointment): JsonResponse
    {
        $this->authorize('view', $appointment);

        $appointment->load([
            'doctor.user',
            'patient.user',
            'creator',
            'observations.doctor.user',
            'observations.patient.user',
            'logs.changedBy',
        ]);

        return (new AppointmentResource($appointment))->response();
    }

    #[OA\Post(
        path: '/appointments/{id}/confirm',
        summary: 'Confirmar consulta',
        description: 'Confirma uma consulta pendente. Apenas o médico responsável ou admin pode confirmar.',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Consulta confirmada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Não autorizado'),
            new OA\Response(response: 422, description: 'Transição de status inválida'),
        ]
    )]
    public function confirm(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('confirm', $appointment);

        $appointment = $this->service->confirm($appointment, $request->user());

        return (new AppointmentResource($appointment))->response();
    }

    #[OA\Post(
        path: '/appointments/{id}/complete',
        summary: 'Marcar consulta como realizada',
        description: 'Marca uma consulta confirmada como realizada. Apenas médico ou admin pode executar.',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Consulta marcada como realizada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Não autorizado'),
            new OA\Response(response: 422, description: 'Transição de status inválida'),
        ]
    )]
    public function complete(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('update', $appointment);

        $appointment = $this->service->complete($appointment, $request->user());

        return (new AppointmentResource($appointment))->response();
    }

    #[OA\Post(
        path: '/appointments/{id}/cancel',
        summary: 'Cancelar consulta',
        description: 'Cancela uma consulta. Requer antecedência mínima de 12h. Pacientes e médicos podem cancelar suas próprias consultas, admin pode cancelar qualquer consulta.',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'reason', type: 'string', example: 'Imprevisto pessoal'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Consulta cancelada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Não autorizado'),
            new OA\Response(response: 422, description: 'Cancelamento não permitido (menos de 12h de antecedência)'),
        ]
    )]
    public function cancel(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('cancel', $appointment);

        $appointment = $this->service->cancel($appointment, $request->user(), $request->input('reason'));

        return (new AppointmentResource($appointment))->response();
    }

    #[OA\Post(
        path: '/appointments/{id}/reschedule',
        summary: 'Remarcar consulta',
        description: 'Remarca uma consulta para nova data/horário. Máximo de 2 remarcações por consulta. Requer antecedência mínima de 12h.',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['scheduled_at'],
                properties: [
                    new OA\Property(property: 'scheduled_at', type: 'string', format: 'date-time', example: '2025-12-05 15:00:00'),
                    new OA\Property(property: 'duration_minutes', type: 'integer', example: 30),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Consulta remarcada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Não autorizado'),
            new OA\Response(response: 422, description: 'Limite de remarcações atingido ou dados inválidos'),
        ]
    )]
    public function reschedule(RescheduleAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('reschedule', $appointment);

        $appointment = $this->service->reschedule($appointment, $request->user(), $request->validated());

        return (new AppointmentResource($appointment))->response();
    }

    #[OA\Get(
        path: '/appointments/scheduling-status',
        summary: 'Verificar status de agendamento',
        description: 'Retorna informações sobre quantas consultas futuras o paciente possui e se pode agendar mais',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Status de agendamento',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'current_future_appointments', type: 'integer', example: 1),
                        new OA\Property(property: 'max_allowed', type: 'integer', example: 2),
                        new OA\Property(property: 'can_schedule', type: 'boolean', example: true),
                        new OA\Property(property: 'remaining_slots', type: 'integer', example: 1),
                        new OA\Property(property: 'is_blocked', type: 'boolean', example: false),
                        new OA\Property(property: 'blocked_reason', type: 'string', nullable: true),
                        new OA\Property(property: 'consecutive_no_shows', type: 'integer', example: 0),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Usuário não é paciente'),
        ]
    )]
    public function schedulingStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $patient = $user->patient;

        if (!$patient) {
            return response()->json([
                'message' => __('Apenas pacientes podem verificar o status de agendamento.'),
            ], 403);
        }

        $futureCount = Appointment::query()
            ->where('patient_id', $patient->id)
            ->where('scheduled_at', '>', now())
            ->whereIn('status', ['PENDING', 'CONFIRMED'])
            ->count();

        $maxAllowed = \App\Application\Appointments\AppointmentValidationService::MAX_FUTURE_APPOINTMENTS_PER_PATIENT;
        $remaining = max(0, $maxAllowed - $futureCount);

        return response()->json([
            'current_future_appointments' => $futureCount,
            'max_allowed' => $maxAllowed,
            'can_schedule' => $remaining > 0 && !$patient->is_blocked,
            'remaining_slots' => $remaining,
            'is_blocked' => (bool) $patient->is_blocked,
            'blocked_reason' => $patient->blocked_reason,
            'consecutive_no_shows' => $patient->consecutive_no_shows ?? 0,
        ]);
    }

    #[OA\Post(
        path: '/appointments/{id}/no-show',
        summary: 'Marcar falta',
        description: 'Marca uma consulta como falta (NO_SHOW). Apenas médicos e administradores podem realizar esta ação.',
        tags: ['Consultas'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'ID da consulta',
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Consulta marcada como falta',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Não autorizado'),
            new OA\Response(response: 404, description: 'Consulta não encontrada'),
            new OA\Response(response: 422, description: 'Não é possível marcar falta'),
        ]
    )]
    public function markNoShow(Appointment $appointment): JsonResponse
    {
        $this->authorize('update', $appointment);

        $appointment = $this->service->markAsNoShow($appointment, request()->user());

        return (new AppointmentResource($appointment))->response();
    }

    private function resolveRole($user): UserRole
    {
        return $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
    }
}

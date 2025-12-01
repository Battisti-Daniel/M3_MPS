<?php

namespace App\Http\Controllers\API;

use App\Application\Schedules\ScheduleService;
use App\Http\Requests\Appointments\StoreScheduleRequest;
use App\Http\Requests\Appointments\UpdateScheduleRequest;
use App\Http\Resources\ScheduleResource;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Agenda')]
class ScheduleController extends Controller
{
    public function __construct(private ScheduleService $service)
    {
        $this->middleware('auth:sanctum');
    }

    #[OA\Get(
        path: '/doctor/schedules',
        summary: 'Listar horários da agenda',
        description: 'Lista todos os horários configurados pelo médico autenticado',
        tags: ['Agenda'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de horários paginada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $schedules = $this->service->listForDoctor($request->user());

        return ScheduleResource::collection($schedules)->response();
    }

    #[OA\Post(
        path: '/doctor/schedules',
        summary: 'Criar horário na agenda',
        description: 'Adiciona um novo horário na agenda do médico. A agenda deve ter no mínimo 4h semanais disponíveis.',
        tags: ['Agenda'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['day_of_week', 'start_time', 'end_time'],
                properties: [
                    new OA\Property(property: 'day_of_week', type: 'integer', minimum: 1, maximum: 7, example: 1, description: '1=Segunda, 7=Domingo'),
                    new OA\Property(property: 'start_time', type: 'string', format: 'time', example: '08:00'),
                    new OA\Property(property: 'end_time', type: 'string', format: 'time', example: '12:00'),
                    new OA\Property(property: 'slot_duration_minutes', type: 'integer', example: 30),
                    new OA\Property(property: 'is_blocked', type: 'boolean', example: false),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Horário criado com sucesso',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Conflito de horário ou mínimo de 4h não atingido'),
        ]
    )]
    public function store(StoreScheduleRequest $request): JsonResponse
    {
        $schedule = $this->service->create($request->user(), $request->validated());

        return (new ScheduleResource($schedule))->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/doctor/schedules/{id}',
        summary: 'Atualizar horário',
        description: 'Atualiza um horário existente. Não é possível atualizar horários que possuem consultas agendadas.',
        tags: ['Agenda'],
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
                properties: [
                    new OA\Property(property: 'day_of_week', type: 'integer', example: 1),
                    new OA\Property(property: 'start_time', type: 'string', format: 'time', example: '09:00'),
                    new OA\Property(property: 'end_time', type: 'string', format: 'time', example: '13:00'),
                    new OA\Property(property: 'is_blocked', type: 'boolean', example: false),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Horário atualizado',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Horário possui consultas agendadas ou mínimo de 4h não atingido'),
        ]
    )]
    public function update(UpdateScheduleRequest $request, Schedule $schedule): JsonResponse
    {
        $schedule = $this->service->update($schedule, $request->user(), $request->validated());

        return (new ScheduleResource($schedule))->response();
    }

    #[OA\Delete(
        path: '/doctor/schedules/{id}',
        summary: 'Remover horário',
        description: 'Remove um horário da agenda. Não é possível remover horários que possuem consultas agendadas. A agenda deve manter no mínimo 4h semanais.',
        tags: ['Agenda'],
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
                description: 'Horário removido',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Horário possui consultas agendadas ou mínimo de 4h não seria atingido'),
        ]
    )]
    public function destroy(Request $request, Schedule $schedule): JsonResponse
    {
        $this->service->delete($schedule, $request->user());

        return response()->json(['message' => __('Horário removido com sucesso.')]);
    }
}

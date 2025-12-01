<?php

namespace App\Http\Controllers\API;

use App\Application\ScheduleBlocks\ScheduleBlockService;
use App\Http\Requests\ScheduleBlocks\StoreScheduleBlockRequest;
use App\Http\Resources\ScheduleBlockResource;
use App\Models\ScheduleBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Bloqueios de Horário')]
class ScheduleBlockController extends Controller
{
    public function __construct(private ScheduleBlockService $service)
    {
        $this->middleware('auth:sanctum');
    }

    #[OA\Get(
        path: '/doctor/schedule-blocks',
        summary: 'Listar bloqueios de horário',
        description: 'Lista todos os bloqueios de horário do médico autenticado',
        tags: ['Bloqueios de Horário'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Filtrar a partir desta data',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Filtrar até esta data',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de bloqueios paginada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $blocks = $this->service->listForDoctor(
            $request->user(),
            $request->query('start_date'),
            $request->query('end_date')
        );

        return ScheduleBlockResource::collection($blocks)->response();
    }

    #[OA\Post(
        path: '/doctor/schedule-blocks',
        summary: 'Criar bloqueio de horário',
        description: 'Bloqueia um horário específico ou dia inteiro para imprevistos. Não é possível bloquear horários com consultas agendadas.',
        tags: ['Bloqueios de Horário'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['blocked_date'],
                properties: [
                    new OA\Property(property: 'blocked_date', type: 'string', format: 'date', example: '2025-12-01'),
                    new OA\Property(property: 'start_time', type: 'string', format: 'time', example: '14:00', description: 'Deixe vazio para bloquear o dia inteiro'),
                    new OA\Property(property: 'end_time', type: 'string', format: 'time', example: '18:00', description: 'Deixe vazio para bloquear o dia inteiro'),
                    new OA\Property(property: 'reason', type: 'string', example: 'Congresso médico'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Bloqueio criado com sucesso',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Existem consultas agendadas no período'),
        ]
    )]
    public function store(StoreScheduleBlockRequest $request): JsonResponse
    {
        try {
            $block = $this->service->create($request->user(), $request->validated());
            return (new ScheduleBlockResource($block))->response()->setStatusCode(201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    #[OA\Delete(
        path: '/doctor/schedule-blocks/{id}',
        summary: 'Remover bloqueio',
        description: 'Remove um bloqueio de horário',
        tags: ['Bloqueios de Horário'],
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
                description: 'Bloqueio removido',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 403, description: 'Sem permissão'),
        ]
    )]
    public function destroy(Request $request, ScheduleBlock $scheduleBlock): JsonResponse
    {
        try {
            $this->service->delete($scheduleBlock, $request->user());
            return response()->json(['message' => 'Bloqueio removido com sucesso.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }
    }
}

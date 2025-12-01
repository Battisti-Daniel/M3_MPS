<?php

namespace App\Http\Controllers\API;

use App\Application\Observations\ObservationService;
use App\Http\Requests\Observations\StoreObservationRequest;
use App\Http\Resources\ObservationResource;
use App\Models\Appointment;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Observações')]
class ObservationController extends Controller
{
    public function __construct(private ObservationService $service)
    {
        $this->middleware('auth:sanctum');
    }

    #[OA\Post(
        path: '/appointments/{id}/observations',
        summary: 'Registrar observação clínica',
        description: 'Registra uma observação clínica para uma consulta. Apenas o médico responsável pela consulta pode registrar observações.',
        tags: ['Observações'],
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
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['anamnesis'],
                properties: [
                    new OA\Property(property: 'anamnesis', type: 'string', example: 'Paciente relata dor de cabeça há 3 dias'),
                    new OA\Property(property: 'diagnosis', type: 'string', example: 'Cefaleia tensional'),
                    new OA\Property(property: 'prescription', type: 'string', example: 'Paracetamol 500mg, 1 comprimido a cada 8h'),
                    new OA\Property(property: 'notes', type: 'string', example: 'Retorno em 7 dias se persistir'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Observação registrada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Apenas o médico responsável pode registrar observações'),
        ]
    )]
    public function store(StoreObservationRequest $request, Appointment $appointment): JsonResponse
    {
        $observation = $this->service->create($request->user(), $appointment, $request->validated());

        return (new ObservationResource($observation))->response()->setStatusCode(201);
    }

    #[OA\Get(
        path: '/patient/observations',
        summary: 'Listar observações do paciente',
        description: 'Lista observações clínicas do paciente autenticado. Pacientes não veem conteúdo completo (anamnesis, diagnosis, prescription, notes são ocultados por sigilo médico).',
        tags: ['Observações'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                description: 'Itens por página',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 20)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de observações (conteúdo clínico oculto para pacientes)',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $observations = $this->service->listForPatient(
            $request->user(),
            (int) $request->query('per_page', 20)
        );

        return ObservationResource::collection($observations)->response();
    }

    #[OA\Get(
        path: '/doctor/patients/{id}/observations',
        summary: 'Histórico de observações do paciente (médico)',
        description: 'Lista histórico completo de observações de um paciente. Apenas médicos que já atenderam o paciente podem acessar o histórico completo.',
        tags: ['Observações'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'ID do paciente',
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                description: 'Itens por página',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 20)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Histórico completo de observações',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Médico não possui atendimentos para este paciente'),
        ]
    )]
    public function historyForDoctor(Request $request, Patient $patient): JsonResponse
    {
        $observations = $this->service->listForDoctor(
            $request->user(),
            $patient->id,
            (int) $request->query('per_page', 20)
        );

        return ObservationResource::collection($observations)->response();
    }
}

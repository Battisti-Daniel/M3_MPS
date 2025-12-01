<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Patients\AdminPatientService;
use App\Http\Controllers\API\Controller;
use App\Http\Requests\Admin\Patient\StorePatientRequest;
use App\Http\Requests\Admin\Patient\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Administração')]
class PatientController extends Controller
{
    public function __construct(private AdminPatientService $service) {}

    #[OA\Get(
        path: '/admin/patients',
        summary: 'Listar pacientes',
        description: 'Lista todos os pacientes cadastrados. Apenas administradores podem acessar.',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'search',
                in: 'query',
                description: 'Buscar por nome, CPF, email ou telefone',
                required: false,
                schema: new OA\Schema(type: 'string')
            ),
            new OA\Parameter(
                name: 'is_active',
                in: 'query',
                description: 'Filtrar por status ativo',
                required: false,
                schema: new OA\Schema(type: 'boolean')
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                description: 'Itens por página',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 15)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de pacientes paginada',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $patients = $this->service->list($request->all());

        return PatientResource::collection($patients)->response();
    }

    #[OA\Post(
        path: '/admin/patients',
        summary: 'Cadastrar paciente',
        description: 'Cria um novo paciente. Se senha não for informada, será gerada automaticamente (12 caracteres) e enviada por e-mail de boas-vindas. CPF deve ser único.',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'cpf', 'birth_date'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'João Silva'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'joao@example.com'),
                    new OA\Property(property: 'phone', type: 'string', example: '(11) 99999-9999'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'senha123', description: 'Opcional - será gerada se não informada (mínimo 8 caracteres)'),
                    new OA\Property(property: 'cpf', type: 'string', example: '123.456.789-00'),
                    new OA\Property(property: 'birth_date', type: 'string', format: 'date', example: '1990-01-15'),
                    new OA\Property(property: 'gender', type: 'string', enum: ['M', 'F', 'OTHER']),
                    new OA\Property(property: 'address', type: 'string', example: 'Rua Exemplo, 123'),
                    new OA\Property(property: 'health_insurance_id', type: 'integer', nullable: true, description: 'ID do convênio principal (opcional)'),
                    new OA\Property(property: 'health_insurances', type: 'array', items: new OA\Items(type: 'integer')),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Paciente cadastrado com sucesso',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Dados inválidos ou CPF duplicado'),
        ]
    )]
    public function store(StorePatientRequest $request): JsonResponse
    {
        $patient = $this->service->create($request->validated());

        return PatientResource::make($patient)->response()->setStatusCode(201);
    }

    #[OA\Get(
        path: '/admin/patients/{id}',
        summary: 'Obter detalhes do paciente',
        description: 'Retorna os detalhes completos de um paciente incluindo usuário e convênios vinculados',
        tags: ['Administração'],
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
                description: 'Detalhes do paciente',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 404, description: 'Paciente não encontrado'),
        ]
    )]
    public function show(Patient $patient): JsonResponse
    {
        $patient->load(['user', 'healthInsurance', 'healthInsurances']);

        return PatientResource::make($patient)->response();
    }

    #[OA\Put(
        path: '/admin/patients/{id}',
        summary: 'Atualizar paciente',
        description: 'Atualiza os dados de um paciente. Todos os campos são opcionais (partial update).',
        tags: ['Administração'],
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
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'phone', type: 'string'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', description: 'Mínimo 8 caracteres'),
                    new OA\Property(property: 'birth_date', type: 'string', format: 'date'),
                    new OA\Property(property: 'gender', type: 'string'),
                    new OA\Property(property: 'address', type: 'string'),
                    new OA\Property(property: 'health_insurance_id', type: 'integer', nullable: true, description: 'ID do convênio principal (opcional)'),
                    new OA\Property(property: 'is_active', type: 'boolean'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paciente atualizado',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 422, description: 'Dados inválidos'),
        ]
    )]
    public function update(UpdatePatientRequest $request, Patient $patient): JsonResponse
    {
        $patient = $this->service->update($patient, $request->validated());

        return PatientResource::make($patient)->response();
    }

    #[OA\Delete(
        path: '/admin/patients/{id}',
        summary: 'Inativar paciente',
        description: 'Inativa um paciente usando soft delete. O registro não é removido fisicamente do banco.',
        tags: ['Administração'],
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
            new OA\Response(response: 204, description: 'Paciente inativado'),
            new OA\Response(response: 404, description: 'Paciente não encontrado'),
        ]
    )]
    public function destroy(Patient $patient): JsonResponse
    {
        $this->service->deactivate($patient);

        return response()->json(null, 204);
    }

    #[OA\Post(
        path: '/admin/patients/{id}/toggle-active',
        summary: 'Alternar status do paciente',
        description: 'Ativa ou desativa um paciente. Quando desativado, não conseguirá acessar o sistema.',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Status alterado', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 404, description: 'Paciente não encontrado'),
        ]
    )]
    public function toggleActive(Patient $patient): JsonResponse
    {
        $newStatus = ! ($patient->user?->is_active ?? true);
        
        $patient->user?->update(['is_active' => $newStatus]);

        return PatientResource::make($patient->load(['user', 'healthInsurance', 'healthInsurances']))->response();
    }
}

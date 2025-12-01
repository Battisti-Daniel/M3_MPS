<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Doctors\AdminDoctorService;
use App\Http\Controllers\API\Controller;
use App\Http\Requests\Admin\Doctor\StoreDoctorRequest;
use App\Http\Requests\Admin\Doctor\UpdateDoctorRequest;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Administração')]
class DoctorController extends Controller
{
    public function __construct(private AdminDoctorService $service) {}

    #[OA\Get(
        path: '/admin/doctors',
        summary: 'Listar médicos',
        description: 'Lista todos os médicos cadastrados. Apenas administradores podem acessar.',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'is_active', in: 'query', required: false, schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 15)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista de médicos', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $doctors = $this->service->list($request->all());

        return DoctorResource::collection($doctors)->response();
    }

    #[OA\Post(
        path: '/admin/doctors',
        summary: 'Cadastrar médico',
        description: 'Cria um novo médico. CRM deve ser único. Senha mínima de 8 caracteres.',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'crm', 'password'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Dr. João Silva'),
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'phone', type: 'string'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', description: 'Mínimo 8 caracteres'),
                    new OA\Property(property: 'crm', type: 'string', example: '123456-SP'),
                    new OA\Property(property: 'specialty', type: 'string', example: 'Cardiologia'),
                    new OA\Property(property: 'health_insurances', type: 'array', items: new OA\Items(type: 'integer')),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Médico cadastrado', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 422, description: 'Dados inválidos ou CRM duplicado'),
        ]
    )]
    public function store(StoreDoctorRequest $request): JsonResponse
    {
        $doctor = $this->service->create($request->validated());

        return DoctorResource::make($doctor)->response()->setStatusCode(201);
    }

    #[OA\Get(
        path: '/admin/doctors/{id}',
        summary: 'Obter detalhes do médico',
        description: 'Retorna os detalhes completos de um médico',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Detalhes do médico', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 404, description: 'Médico não encontrado'),
        ]
    )]
    public function show(Doctor $doctor): JsonResponse
    {
        $doctor->load(['user', 'healthInsurances']);

        return DoctorResource::make($doctor)->response();
    }

    #[OA\Put(
        path: '/admin/doctors/{id}',
        summary: 'Atualizar médico',
        description: 'Atualiza os dados de um médico',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(type: 'object')),
        responses: [
            new OA\Response(response: 200, description: 'Médico atualizado', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 422, description: 'Dados inválidos'),
        ]
    )]
    public function update(UpdateDoctorRequest $request, Doctor $doctor): JsonResponse
    {
        $doctor = $this->service->update($doctor, $request->validated());

        return DoctorResource::make($doctor)->response();
    }

    #[OA\Delete(
        path: '/admin/doctors/{id}',
        summary: 'Inativar médico',
        description: 'Inativa um médico usando soft delete',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Médico inativado'),
            new OA\Response(response: 404, description: 'Médico não encontrado'),
        ]
    )]
    public function destroy(Doctor $doctor): JsonResponse
    {
        $this->service->deactivate($doctor);

        return response()->json(null, 204);
    }

    #[OA\Post(
        path: '/admin/doctors/{id}/toggle-active',
        summary: 'Alternar status do médico',
        description: 'Ativa ou desativa um médico. Quando desativado, não aparecerá na lista de médicos disponíveis para agendamento.',
        tags: ['Administração'],
        security: [['bearerAuth' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Status alterado', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 404, description: 'Médico não encontrado'),
        ]
    )]
    public function toggleActive(Doctor $doctor): JsonResponse
    {
        // Verifica o status atual: está ativo se AMBOS (doctor e user) estiverem ativos
        $currentlyActive = $doctor->is_active && $doctor->user?->is_active;
        $newStatus = !$currentlyActive;
        
        // Atualiza ambos para garantir sincronização
        $doctor->update(['is_active' => $newStatus]);
        if ($doctor->user) {
            $doctor->user->update(['is_active' => $newStatus]);
        }

        return DoctorResource::make($doctor->load(['user', 'healthInsurances']))->response();
    }
}

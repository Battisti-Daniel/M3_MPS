<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\HealthInsurance\StoreHealthInsuranceRequest;
use App\Http\Requests\HealthInsurance\UpdateHealthInsuranceRequest;
use App\Http\Resources\HealthInsuranceResource;
use App\Models\HealthInsurance;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Convênios')]
class HealthInsuranceController extends Controller
{
    #[OA\Get(
        path: '/health-insurances',
        summary: 'Listar convênios ativos',
        description: 'Lista todos os convênios ativos disponíveis. Endpoint público (não requer autenticação).',
        tags: ['Convênios'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de convênios',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
    public function index(): JsonResponse
    {
        $query = HealthInsurance::query();
        
        // Se for admin, pode ver todos (ativos e inativos)
        if (auth()->check() && auth()->user()?->role === \App\Domain\Shared\Enums\UserRole::ADMIN) {
            // Admin vê todos
        } else {
            // Público vê apenas ativos
            $query->where('is_active', true);
        }
        
        $insurances = $query->withCount([
            'patients as beneficiaries_count' => function ($q) {
                $q->where('patient_health_insurance.is_active', true);
            },
            'doctors as doctors_count' => function ($q) {
                $q->where('doctor_health_insurance.is_active', true);
            }
        ])->orderBy('name')->get();
        
        return HealthInsuranceResource::collection($insurances)->response();
    }
    
    #[OA\Get(
        path: '/admin/health-insurances/statistics',
        summary: 'Estatísticas de convênios',
        description: 'Retorna estatísticas agregadas sobre convênios (total de beneficiários, média, etc.).',
        tags: ['Convênios'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Estatísticas de convênios',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
    public function statistics(): JsonResponse
    {
        $totalBeneficiaries = DB::table('patient_health_insurance')
            ->where('is_active', true)
            ->distinct()
            ->count('patient_id');
        
        $activeInsurances = HealthInsurance::where('is_active', true)
            ->withCount(['patients as beneficiaries_count' => function ($q) {
                $q->where('patient_health_insurance.is_active', true);
            }])
            ->get();
        
        $averageBeneficiaries = $activeInsurances->count() > 0
            ? round($activeInsurances->sum('beneficiaries_count') / $activeInsurances->count(), 2)
            : 0;
        
        return response()->json([
            'total_beneficiaries' => $totalBeneficiaries,
            'total_active_insurances' => $activeInsurances->count(),
            'average_beneficiaries_per_insurance' => $averageBeneficiaries,
        ]);
    }

    #[OA\Post(
        path: '/health-insurances',
        summary: 'Criar convênio',
        description: 'Cria um novo convênio. Apenas administradores podem criar convênios.',
        tags: ['Convênios'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Unimed'),
                    new OA\Property(property: 'description', type: 'string', example: 'Plano de saúde'),
                    new OA\Property(property: 'coverage_percentage', type: 'number', format: 'float', example: 80.00),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Convênio criado',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function store(StoreHealthInsuranceRequest $request): JsonResponse
    {
        $insurance = HealthInsurance::create($request->validated());

        return HealthInsuranceResource::make($insurance)
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Put(
        path: '/health-insurances/{id}',
        summary: 'Atualizar convênio',
        description: 'Atualiza dados de um convênio. Apenas administradores podem atualizar.',
        tags: ['Convênios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'coverage_percentage', type: 'number', format: 'float'),
                    new OA\Property(property: 'is_active', type: 'boolean'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Convênio atualizado', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function update(UpdateHealthInsuranceRequest $request, HealthInsurance $healthInsurance): JsonResponse
    {
        $healthInsurance->update($request->validated());

        return HealthInsuranceResource::make($healthInsurance)->response();
    }

    #[OA\Delete(
        path: '/health-insurances/{id}',
        summary: 'Inativar convênio',
        description: 'Inativa um convênio usando soft delete. O registro não é removido fisicamente. Apenas administradores podem inativar.',
        tags: ['Convênios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Convênio inativado',
                content: new OA\JsonContent(
                    properties: [new OA\Property(property: 'message', type: 'string')]
                )
            ),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function destroy(HealthInsurance $healthInsurance): JsonResponse
    {
        $healthInsurance->update(['is_active' => false]);
        $healthInsurance->delete();

        return response()->json([
            'message' => __('Convênio inativado com sucesso.'),
        ]);
    }
}

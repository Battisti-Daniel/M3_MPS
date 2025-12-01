<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Reports\AdminReportService;
use App\Application\Reports\PdfReportService;
use App\Http\Controllers\API\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Relatórios')]
class ReportController extends Controller
{
    public function __construct(
        private AdminReportService $service,
        private PdfReportService $pdfService
    ) {}

    #[OA\Get(
        path: '/admin/reports/appointments',
        summary: 'Relatório de resumo de consultas (JSON)',
        description: 'Retorna resumo estatístico de consultas em formato JSON. Inclui total por status, percentuais e tendência diária.',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Data inicial (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Data final (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'doctor_id',
                in: 'query',
                description: 'Filtrar por médico',
                required: false,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dados do relatório',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function appointmentSummary(Request $request): JsonResponse
    {
        $data = $this->service->appointmentSummary($request->all());

        return response()->json($data);
    }

    #[OA\Get(
        path: '/admin/reports/appointments/pdf',
        summary: 'Gerar PDF - Resumo de consultas',
        description: 'Gera e baixa relatório em PDF do resumo de consultas com gráficos e estatísticas',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Data inicial (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Data final (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Arquivo PDF',
                content: new OA\MediaType(mediaType: 'application/pdf')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function appointmentSummaryPdf(Request $request)
    {
        $pdf = $this->pdfService->generateAppointmentSummaryPdf($request->all());

        return $pdf->download('relatorio-consultas-'.now()->format('Y-m-d').'.pdf');
    }

    #[OA\Get(
        path: '/admin/reports/doctor-occupancy',
        summary: 'Relatório de ocupação de médicos (JSON)',
        description: 'Retorna dados de ocupação dos médicos em formato JSON. Inclui total de consultas, confirmadas, realizadas e taxa de ocupação.',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Data inicial (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Data final (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'doctor_id',
                in: 'query',
                description: 'Filtrar por médico específico',
                required: false,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dados de ocupação',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function doctorOccupancy(Request $request): JsonResponse
    {
        $data = $this->service->doctorOccupancy($request->all());

        return response()->json([
            'data' => $data,
        ]);
    }

    #[OA\Get(
        path: '/admin/reports/doctor-occupancy/pdf',
        summary: 'Gerar PDF - Ocupação de médicos',
        description: 'Gera e baixa relatório em PDF de ocupação dos médicos com tabela comparativa',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Data inicial (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Data final (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Arquivo PDF',
                content: new OA\MediaType(mediaType: 'application/pdf')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function doctorOccupancyPdf(Request $request)
    {
        $pdf = $this->pdfService->generateDoctorOccupancyPdf($request->all());

        return $pdf->download('relatorio-ocupacao-medicos-'.now()->format('Y-m-d').'.pdf');
    }

    #[OA\Get(
        path: '/admin/reports/insurance-usage',
        summary: 'Relatório de uso de convênios (JSON)',
        description: 'Retorna dados de uso dos convênios em formato JSON. Mostra quantidade de consultas por convênio no período.',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Data inicial (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Data final (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dados de uso de convênios',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function insuranceUsage(Request $request): JsonResponse
    {
        $data = $this->service->insuranceUsage($request->all());

        return response()->json([
            'data' => $data,
        ]);
    }

    #[OA\Get(
        path: '/admin/reports/insurance-usage/pdf',
        summary: 'Gerar PDF - Uso de convênios',
        description: 'Gera e baixa relatório em PDF de uso de convênios com estatísticas',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Data inicial (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Data final (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Arquivo PDF',
                content: new OA\MediaType(mediaType: 'application/pdf')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function insuranceUsagePdf(Request $request)
    {
        $pdf = $this->pdfService->generateInsuranceUsagePdf($request->all());

        return $pdf->download('relatorio-convenios-'.now()->format('Y-m-d').'.pdf');
    }

    #[OA\Get(
        path: '/admin/reports/billing',
        summary: 'Relatório de faturamento (JSON)',
        description: 'Retorna dados de faturamento em formato JSON. Inclui receita total, ticket médio, faturamento por status, médico e mês.',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Data inicial (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Data final (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'doctor_id',
                in: 'query',
                description: 'Filtrar por médico',
                required: false,
                schema: new OA\Schema(type: 'integer')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dados de faturamento',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function billing(Request $request): JsonResponse
    {
        $data = $this->service->billing($request->all());

        return response()->json($data);
    }

    #[OA\Get(
        path: '/admin/reports/billing/pdf',
        summary: 'Gerar PDF - Faturamento',
        description: 'Gera e baixa relatório em PDF de faturamento com gráficos e estatísticas',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'start_date',
                in: 'query',
                description: 'Data inicial (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'end_date',
                in: 'query',
                description: 'Data final (Y-m-d)',
                required: false,
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Arquivo PDF',
                content: new OA\MediaType(mediaType: 'application/pdf')
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function billingPdf(Request $request)
    {
        $pdf = $this->pdfService->generateBillingPdf($request->all());

        return $pdf->download('relatorio-faturamento-'.now()->format('Y-m-d').'.pdf');
    }

    #[OA\Get(
        path: '/admin/reports/appointments-by-doctor',
        summary: 'Relatório de consultas por médico e especialidade (JSON)',
        description: 'Retorna dados de consultas agrupados por médico e especialidade. Inclui total, realizadas, canceladas e taxa de conclusão.',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'start_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'end_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'doctor_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Dados do relatório', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function appointmentsByDoctor(Request $request): JsonResponse
    {
        $data = $this->service->appointmentsByDoctorAndSpecialty($request->all());

        return response()->json($data);
    }

    #[OA\Get(
        path: '/admin/reports/appointments-by-doctor/pdf',
        summary: 'Gerar PDF - Consultas por médico e especialidade',
        description: 'Gera relatório em PDF com consultas agrupadas por médico e especialidade',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'start_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'end_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Arquivo PDF', content: new OA\MediaType(mediaType: 'application/pdf')),
        ]
    )]
    public function appointmentsByDoctorPdf(Request $request)
    {
        $pdf = $this->pdfService->generateAppointmentsByDoctorPdf($request->all());

        return $pdf->download('relatorio-consultas-por-medico-'.now()->format('Y-m-d').'.pdf');
    }

    #[OA\Get(
        path: '/admin/reports/cancellations',
        summary: 'Relatório de cancelamentos e remarcações (JSON)',
        description: 'Retorna dados de cancelamentos, faltas e remarcações. Inclui taxa de cancelamento, motivos e distribuição por dia da semana.',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'start_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'end_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'doctor_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Dados do relatório', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function cancellations(Request $request): JsonResponse
    {
        $data = $this->service->cancellationsAndReschedules($request->all());

        return response()->json($data);
    }

    #[OA\Get(
        path: '/admin/reports/cancellations/pdf',
        summary: 'Gerar PDF - Cancelamentos e remarcações',
        description: 'Gera relatório em PDF com análise de cancelamentos e remarcações',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'start_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'end_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Arquivo PDF', content: new OA\MediaType(mediaType: 'application/pdf')),
        ]
    )]
    public function cancellationsPdf(Request $request)
    {
        $pdf = $this->pdfService->generateCancellationsPdf($request->all());

        return $pdf->download('relatorio-cancelamentos-'.now()->format('Y-m-d').'.pdf');
    }

    #[OA\Get(
        path: '/admin/reports/top-patients',
        summary: 'Relatório de pacientes mais frequentes (JSON)',
        description: 'Retorna ranking de pacientes com mais consultas no período. Inclui taxa de comparecimento e valor total gasto.',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'start_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'end_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'doctor_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Dados do relatório', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function topPatients(Request $request): JsonResponse
    {
        $data = $this->service->topPatients($request->all());

        return response()->json($data);
    }

    #[OA\Get(
        path: '/admin/reports/top-patients/pdf',
        summary: 'Gerar PDF - Pacientes mais frequentes',
        description: 'Gera relatório em PDF com ranking de pacientes mais frequentes',
        tags: ['Relatórios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'start_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'end_date', in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Arquivo PDF', content: new OA\MediaType(mediaType: 'application/pdf')),
        ]
    )]
    public function topPatientsPdf(Request $request)
    {
        $pdf = $this->pdfService->generateTopPatientsPdf($request->all());

        return $pdf->download('relatorio-pacientes-frequentes-'.now()->format('Y-m-d').'.pdf');
    }
}

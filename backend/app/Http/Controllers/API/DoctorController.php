<?php

namespace App\Http\Controllers\API;

use App\Application\ScheduleBlocks\ScheduleBlockService;
use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Appointment;
use App\Models\Doctor;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Médicos')]
class DoctorController extends Controller
{
    public function index(): JsonResponse
    {
        // Para agendamento, mostra médicos ativos (tanto doctor.is_active quanto user.is_active)
        $query = Doctor::with(['user', 'healthInsurances'])
            ->where('doctors.is_active', true)
            ->whereHas('user', function ($q) {
                $q->where('is_active', true);
            });

        if (request()->has('crm')) {
            $query->where('doctors.crm', request('crm'));
        }

        // Para agendamento, retorna todos os médicos ativos (sem paginação limitada)
        $perPage = min((int) request('per_page', 100), 100); // máximo 100
        
        // Busca todos e ordena pelo nome do usuário
        $allDoctors = $query->get();
        $sortedDoctors = $allDoctors->sortBy(function ($doctor) {
            return strtolower($doctor->user?->name ?? '');
        })->values();
        
        // Paginação manual
        $currentPage = (int) request('page', 1);
        $offset = ($currentPage - 1) * $perPage;
        $paginatedDoctors = $sortedDoctors->slice($offset, $perPage);
        
        // Cria uma resposta paginada compatível
        return response()->json([
            'data' => DoctorResource::collection($paginatedDoctors),
            'meta' => [
                'current_page' => $currentPage,
                'per_page' => $perPage,
                'total' => $sortedDoctors->count(),
                'last_page' => (int) ceil($sortedDoctors->count() / $perPage),
            ],
        ]);

        return DoctorResource::collection($doctors)->response();
    }

    public function show(Doctor $doctor): DoctorResource
    {
        $doctor->loadMissing(['user', 'healthInsurances', 'schedules']);

        return new DoctorResource($doctor);
    }

    #[OA\Get(
        path: '/doctors/{id}/available-slots',
        summary: 'Buscar horários disponíveis do médico',
        description: 'Retorna os horários disponíveis do médico para uma data específica, considerando a agenda configurada e consultas já agendadas',
        tags: ['Médicos'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'ID do médico',
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'date',
                in: 'query',
                required: true,
                description: 'Data para buscar horários (formato: Y-m-d)',
                schema: new OA\Schema(type: 'string', format: 'date', example: '2025-12-15')
            ),
            new OA\Parameter(
                name: 'duration',
                in: 'query',
                required: false,
                description: 'Duração da consulta em minutos (padrão: 30)',
                schema: new OA\Schema(type: 'integer', example: 30)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de horários disponíveis',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(
                            property: 'available_slots',
                            type: 'array',
                            items: new OA\Items(type: 'string', example: '2025-12-15 09:00:00')
                        ),
                        new OA\Property(property: 'date', type: 'string', example: '2025-12-15'),
                        new OA\Property(property: 'doctor_id', type: 'integer', example: 1),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Médico não encontrado'),
            new OA\Response(response: 422, description: 'Data inválida ou no passado'),
        ]
    )]
    public function availableSlots(Request $request, Doctor $doctor): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today'],
            'duration' => ['nullable', 'integer', 'min:15', 'max:240'],
        ]);

        $date = Carbon::parse($validated['date']);
        $duration = $validated['duration'] ?? 30;

        // Busca o schedule do médico para o dia da semana
        $dayOfWeek = $date->dayOfWeekIso; // 1 = Segunda, 7 = Domingo
        
        $schedule = $doctor->schedules()
            ->where('day_of_week', $dayOfWeek)
            ->where('is_blocked', false)
            ->first();

        if (! $schedule) {
            return response()->json([
                'available_slots' => [],
                'date' => $date->format('Y-m-d'),
                'doctor_id' => $doctor->id,
                'message' => 'O médico não possui agenda disponível neste dia.',
            ]);
        }

        // Busca consultas já agendadas para essa data
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        $appointments = Appointment::where('doctor_id', $doctor->id)
            ->whereBetween('scheduled_at', [$startOfDay, $endOfDay])
            ->whereIn('status', ['PENDING', 'CONFIRMED'])
            ->get();

        // Verifica se o dia inteiro está bloqueado
        if (ScheduleBlockService::isBlocked($doctor->id, $date->format('Y-m-d'))) {
            return response()->json([
                'available_slots' => [],
                'busy_slots' => [],
                'all_slots' => [],
                'date' => $date->format('Y-m-d'),
                'doctor_id' => $doctor->id,
                'message' => 'O médico bloqueou este dia por imprevisto.',
                'is_blocked' => true,
            ]);
        }

        // Calcula os slots disponíveis
        $slotsData = $this->calculateAvailableSlots(
            $schedule,
            $date,
            $duration,
            $appointments
        );

        return response()->json([
            'available_slots' => $slotsData['available'],
            'busy_slots' => $slotsData['busy'],
            'all_slots' => $slotsData['all'],
            'date' => $date->format('Y-m-d'),
            'doctor_id' => $doctor->id,
            'schedule' => [
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
            ],
        ]);
    }

    /**
     * Calcula os slots disponíveis e ocupados baseado no schedule, data, duração e consultas já agendadas
     */
    private function calculateAvailableSlots(
        $schedule,
        Carbon $date,
        int $duration,
        $appointments
    ): array {
        $availableSlots = [];
        $busySlots = [];
        $allSlots = [];
        
        // Parse dos horários de início e fim do schedule
        $scheduleStart = Carbon::parse($schedule->start_time);
        $scheduleEnd = Carbon::parse($schedule->end_time);
        
        // Define a data e hora do início do schedule para o dia solicitado
        $currentSlot = $date->copy()
            ->setTime($scheduleStart->hour, $scheduleStart->minute, 0);
        
        $endTime = $date->copy()
            ->setTime($scheduleEnd->hour, $scheduleEnd->minute, 0);
        
        // Considera antecedência mínima de 24 horas
        $minDateTime = now()->addDay();
        
        while ($currentSlot->copy()->addMinutes($duration)->lte($endTime)) {
            $slotTime = $currentSlot->format('Y-m-d H:i:s');
            $slotEnd = $currentSlot->copy()->addMinutes($duration);
            
            // Verifica se o horário está no futuro (mínimo 24h)
            $isInFuture = $currentSlot->gte($minDateTime);
            
            // Verifica se há conflito com consultas já agendadas
            $hasConflict = false;
            foreach ($appointments as $appointment) {
                $appointmentStart = Carbon::parse($appointment->scheduled_at);
                $appointmentEnd = $appointmentStart->copy()->addMinutes(
                    $appointment->duration_minutes ?? 30
                );
                
                // Verifica sobreposição
                if ($currentSlot->lt($appointmentEnd) && $slotEnd->gt($appointmentStart)) {
                    $hasConflict = true;
                    break;
                }
            }
            
            // Só adiciona na lista se estiver no futuro (pelo menos 24h)
            if ($isInFuture) {
                $slotInfo = [
                    'time' => $slotTime,
                    'available' => !$hasConflict,
                ];
                $allSlots[] = $slotInfo;
                
                if ($hasConflict) {
                    $busySlots[] = $slotTime;
                } else {
                    $availableSlots[] = $slotTime;
                }
            }
            
            // Avança em incrementos de 30 minutos
            $currentSlot->addMinutes(30);
        }
        
        return [
            'available' => $availableSlots,
            'busy' => $busySlots,
            'all' => $allSlots,
        ];
    }

    #[OA\Get(
        path: '/doctors/{id}/available-dates',
        summary: 'Buscar dias disponíveis do médico no mês',
        description: 'Retorna os dias do mês em que o médico possui agenda disponível',
        tags: ['Médicos'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'month',
                in: 'query',
                required: false,
                description: 'Mês no formato Y-m (padrão: mês atual)',
                schema: new OA\Schema(type: 'string', example: '2025-12')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de dias disponíveis',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(
                            property: 'available_dates',
                            type: 'array',
                            items: new OA\Items(type: 'string', example: '2025-12-15')
                        ),
                        new OA\Property(property: 'month', type: 'string', example: '2025-12'),
                    ]
                )
            ),
        ]
    )]
    public function availableDates(Request $request, Doctor $doctor): JsonResponse
    {
        $month = $request->input('month', now()->format('Y-m'));
        $startOfMonth = Carbon::parse($month . '-01')->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        
        // Busca todos os schedules ativos do médico
        $schedules = $doctor->schedules()
            ->where('is_blocked', false)
            ->get()
            ->groupBy('day_of_week');
        
        if ($schedules->isEmpty()) {
            return response()->json([
                'available_dates' => [],
                'month' => $month,
                'message' => 'Este médico não possui agenda configurada. Configure os horários de atendimento primeiro.',
                'has_schedules' => false,
            ]);
        }
        
        $availableDates = [];
        $minDate = now()->addDay()->startOfDay();
        $currentDate = $startOfMonth->copy();
        
        while ($currentDate->lte($endOfMonth)) {
            // Verifica se já passou o mínimo de 24h
            if ($currentDate->gte($minDate)) {
                $dayOfWeek = $currentDate->dayOfWeekIso;
                
                // Verifica se há schedule para este dia da semana
                if ($schedules->has($dayOfWeek)) {
                    // Verifica se há pelo menos um horário disponível nesse dia
                    $daySchedule = $schedules->get($dayOfWeek)->first();
                    if ($daySchedule) {
                        $dateStr = $currentDate->format('Y-m-d');
                        
                        // Busca consultas desse dia para verificar se ainda há slots disponíveis
                        $appointmentsCount = Appointment::where('doctor_id', $doctor->id)
                            ->whereDate('scheduled_at', $dateStr)
                            ->whereIn('status', ['PENDING', 'CONFIRMED'])
                            ->count();
                        
                        // Calcula slots possíveis somando todos os períodos do dia
                        $possibleSlots = 0;
                        foreach ($schedules->get($dayOfWeek) as $schedule) {
                            $scheduleStart = Carbon::parse($schedule->start_time);
                            $scheduleEnd = Carbon::parse($schedule->end_time);
                            // diffInMinutes retorna negativo se o segundo argumento é maior, então invertemos a ordem
                            $totalMinutes = $scheduleStart->diffInMinutes($scheduleEnd);
                            $possibleSlots += floor($totalMinutes / ($schedule->slot_duration_minutes ?? 30));
                        }
                        
                        if ($appointmentsCount < $possibleSlots) {
                            $availableDates[] = $dateStr;
                        }
                    }
                }
            }
            
            $currentDate->addDay();
        }
        
        return response()->json([
            'available_dates' => $availableDates,
            'month' => $month,
            'has_schedules' => true,
        ]);
    }
}

<?php

namespace App\Application\ScheduleBlocks;

use App\Models\Doctor;
use App\Models\ScheduleBlock;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class ScheduleBlockService
{
    /**
     * Lista bloqueios do médico
     */
    public function listForDoctor(User $user, ?string $startDate = null, ?string $endDate = null): LengthAwarePaginator
    {
        $doctor = Doctor::where('user_id', $user->id)->firstOrFail();

        $query = ScheduleBlock::where('doctor_id', $doctor->id)
            ->orderBy('blocked_date', 'desc');

        if ($startDate) {
            $query->where('blocked_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('blocked_date', '<=', $endDate);
        }

        return $query->paginate(20);
    }

    /**
     * Cria um novo bloqueio de horário
     */
    public function create(User $user, array $data): ScheduleBlock
    {
        $doctor = Doctor::where('user_id', $user->id)->firstOrFail();

        // Validar se não há consultas agendadas no período
        $blockedDate = Carbon::parse($data['blocked_date']);
        
        $query = $doctor->appointments()
            ->whereDate('scheduled_at', $blockedDate)
            ->whereIn('status', ['PENDING', 'CONFIRMED']);

        if (!empty($data['start_time']) && !empty($data['end_time'])) {
            // Bloqueio parcial - verificar apenas horários específicos
            $query->whereTime('scheduled_at', '>=', $data['start_time'])
                  ->whereTime('scheduled_at', '<', $data['end_time']);
        }

        if ($query->exists()) {
            throw new \Exception('Existem consultas agendadas neste período. Cancele-as antes de bloquear o horário.');
        }

        return ScheduleBlock::create([
            'doctor_id' => $doctor->id,
            'blocked_date' => $data['blocked_date'],
            'start_time' => $data['start_time'] ?? null,
            'end_time' => $data['end_time'] ?? null,
            'reason' => $data['reason'] ?? null,
        ]);
    }

    /**
     * Remove um bloqueio
     */
    public function delete(ScheduleBlock $block, User $user): void
    {
        $doctor = Doctor::where('user_id', $user->id)->firstOrFail();

        if ($block->doctor_id !== $doctor->id) {
            throw new \Exception('Você não tem permissão para remover este bloqueio.');
        }

        $block->delete();
    }

    /**
     * Verifica se uma data/hora está bloqueada para um médico
     */
    public static function isBlocked(int $doctorId, string $date, ?string $time = null): bool
    {
        $blocks = ScheduleBlock::where('doctor_id', $doctorId)
            ->where('blocked_date', $date)
            ->get();

        foreach ($blocks as $block) {
            if ($block->isFullDay()) {
                return true;
            }

            if ($time && $block->coversTime($time)) {
                return true;
            }
        }

        return false;
    }
}

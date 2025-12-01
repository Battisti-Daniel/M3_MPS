<?php

namespace App\Domain\Shared\ValueObjects;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

/**
 * Value Object para data/hora agendada
 *
 * Garante que a data/hora seja válida e futura
 */
class ScheduledDateTime
{
    public function __construct(
        private readonly CarbonInterface $value
    ) {
        $this->validate();
    }

    public static function fromString(string $dateTime): self
    {
        try {
            return new self(Carbon::parse($dateTime));
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Data/hora inválida.'),
            ]);
        }
    }

    public static function fromCarbon(CarbonInterface $dateTime): self
    {
        return new self($dateTime);
    }

    public function value(): CarbonInterface
    {
        return $this->value;
    }

    public function toDateTimeString(): string
    {
        return $this->value->toDateTimeString();
    }

    public function toIso8601String(): string
    {
        return $this->value->toIso8601String();
    }

    public function isFuture(): bool
    {
        return $this->value->isFuture();
    }

    public function isPast(): bool
    {
        return $this->value->isPast();
    }

    public function diffInHours(?CarbonInterface $date = null): int
    {
        $date = $date ?? now();

        return $this->value->diffInHours($date, false);
    }

    public function isAfter(CarbonInterface $date): bool
    {
        return $this->value->isAfter($date);
    }

    public function isBefore(CarbonInterface $date): bool
    {
        return $this->value->isBefore($date);
    }

    public function format(string $format): string
    {
        return $this->value->format($format);
    }

    public function dayOfWeekIso(): int
    {
        return $this->value->dayOfWeekIso;
    }

    public function copy(): CarbonInterface
    {
        return $this->value->copy();
    }

    public function addMinutes(int $minutes): CarbonInterface
    {
        return $this->value->copy()->addMinutes($minutes);
    }

    protected function validate(): void
    {
        if ($this->value->isPast()) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Não é possível agendar no passado.'),
            ]);
        }
    }

    public function __toString(): string
    {
        return $this->toDateTimeString();
    }
}

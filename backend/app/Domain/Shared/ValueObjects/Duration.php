<?php

namespace App\Domain\Shared\ValueObjects;

use Illuminate\Validation\ValidationException;

/**
 * Value Object para duração em minutos
 *
 * Garante que a duração seja válida (positiva e dentro de limites razoáveis)
 */
class Duration
{
    private const MIN_DURATION = 15; // 15 minutos mínimo

    private const MAX_DURATION = 240; // 4 horas máximo

    private const DEFAULT_DURATION = 30; // 30 minutos padrão

    public function __construct(
        private readonly int $minutes
    ) {
        $this->validate();
    }

    public static function fromMinutes(int $minutes): self
    {
        return new self($minutes);
    }

    public static function default(): self
    {
        return new self(self::DEFAULT_DURATION);
    }

    public function minutes(): int
    {
        return $this->minutes;
    }

    public function hours(): float
    {
        return $this->minutes / 60;
    }

    public function inSeconds(): int
    {
        return $this->minutes * 60;
    }

    public function formatted(): string
    {
        if ($this->minutes < 60) {
            return "{$this->minutes} min";
        }

        $hours = floor($this->minutes / 60);
        $remainingMinutes = $this->minutes % 60;

        if ($remainingMinutes === 0) {
            return "{$hours}h";
        }

        return "{$hours}h {$remainingMinutes}min";
    }

    public function add(Duration $other): self
    {
        return new self($this->minutes + $other->minutes);
    }

    public function subtract(Duration $other): self
    {
        $result = $this->minutes - $other->minutes;

        return new self(max(self::MIN_DURATION, $result));
    }

    public function equals(Duration $other): bool
    {
        return $this->minutes === $other->minutes;
    }

    public function isGreaterThan(Duration $other): bool
    {
        return $this->minutes > $other->minutes;
    }

    public function isLessThan(Duration $other): bool
    {
        return $this->minutes < $other->minutes;
    }

    protected function validate(): void
    {
        if ($this->minutes < self::MIN_DURATION) {
            throw ValidationException::withMessages([
                'duration_minutes' => __('Duração mínima é de :min minutos.', ['min' => self::MIN_DURATION]),
            ]);
        }

        if ($this->minutes > self::MAX_DURATION) {
            throw ValidationException::withMessages([
                'duration_minutes' => __('Duração máxima é de :max minutos.', ['max' => self::MAX_DURATION]),
            ]);
        }
    }

    public function __toString(): string
    {
        return (string) $this->minutes;
    }
}

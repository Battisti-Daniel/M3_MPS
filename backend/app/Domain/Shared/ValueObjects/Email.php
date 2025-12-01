<?php

namespace App\Domain\Shared\ValueObjects;

use Illuminate\Validation\ValidationException;

class Email
{
    public function __construct(
        private readonly string $value
    ) {
        if (! filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw ValidationException::withMessages([
                'email' => __('O e-mail fornecido é inválido.'),
            ]);
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(Email $other): bool
    {
        return $this->value === $other->value;
    }
}

<?php

namespace App\Domain\Shared\ValueObjects;

use Illuminate\Validation\ValidationException;

class CPF
{
    public function __construct(
        private readonly string $value
    ) {
        $cpf = preg_replace('/[^0-9]/', '', $value);

        if (strlen($cpf) !== 11) {
            throw ValidationException::withMessages([
                'cpf' => __('CPF deve conter 11 dígitos.'),
            ]);
        }

        if (! $this->isValid($cpf)) {
            throw ValidationException::withMessages([
                'cpf' => __('CPF inválido.'),
            ]);
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function formatted(): string
    {
        $cpf = preg_replace('/[^0-9]/', '', $this->value);

        return substr($cpf, 0, 3).'.'.
               substr($cpf, 3, 3).'.'.
               substr($cpf, 6, 3).'-'.
               substr($cpf, 9, 2);
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(CPF $other): bool
    {
        return preg_replace('/[^0-9]/', '', $this->value) ===
               preg_replace('/[^0-9]/', '', $other->value);
    }

    private function isValid(string $cpf): bool
    {
        if (preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }

        for ($t = 9; $t < 11; $t++) {
            for ($d = 0, $c = 0; $c < $t; $c++) {
                $d += (int) $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ((int) $cpf[$c] !== $d) {
                return false;
            }
        }

        return true;
    }
}

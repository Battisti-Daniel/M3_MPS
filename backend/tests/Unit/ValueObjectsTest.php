<?php

namespace Tests\Unit;

use App\Domain\Shared\ValueObjects\Duration;
use App\Domain\Shared\ValueObjects\ScheduledDateTime;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ValueObjectsTest extends TestCase
{
    public function test_duration_creates_from_minutes(): void
    {
        $duration = Duration::fromMinutes(30);

        $this->assertEquals(30, $duration->minutes());
        $this->assertEquals(0.5, $duration->hours());
        $this->assertEquals(1800, $duration->inSeconds());
    }

    public function test_duration_throws_exception_for_minimum(): void
    {
        $this->expectException(ValidationException::class);

        Duration::fromMinutes(10);
    }

    public function test_duration_throws_exception_for_maximum(): void
    {
        $this->expectException(ValidationException::class);

        Duration::fromMinutes(300);
    }

    public function test_duration_formatted_returns_correct_format(): void
    {
        $duration = Duration::fromMinutes(30);
        $this->assertEquals('30 min', $duration->formatted());

        $duration = Duration::fromMinutes(90);
        $this->assertEquals('1h 30min', $duration->formatted());

        $duration = Duration::fromMinutes(120);
        $this->assertEquals('2h', $duration->formatted());
    }

    public function test_duration_can_add_and_subtract(): void
    {
        $duration1 = Duration::fromMinutes(30);
        $duration2 = Duration::fromMinutes(45);

        $result = $duration1->add($duration2);
        $this->assertEquals(75, $result->minutes());

        $result = $duration2->subtract($duration1);
        $this->assertEquals(15, $result->minutes());
    }

    public function test_scheduled_date_time_creates_from_string(): void
    {
        $futureDate = Carbon::now()->addDays(2);
        $scheduled = ScheduledDateTime::fromString($futureDate->toIso8601String());

        $this->assertInstanceOf(ScheduledDateTime::class, $scheduled);
        $this->assertTrue($scheduled->isFuture());
    }

    public function test_scheduled_date_time_throws_exception_for_past(): void
    {
        $this->expectException(ValidationException::class);

        $pastDate = Carbon::now()->subDays(1);
        ScheduledDateTime::fromString($pastDate->toIso8601String());
    }

    public function test_scheduled_date_time_can_format(): void
    {
        $futureDate = Carbon::now()->addDays(2)->setTime(14, 30);
        $scheduled = ScheduledDateTime::fromString($futureDate->toIso8601String());

        $this->assertEquals('14:30', $scheduled->format('H:i'));
        // Calcula o dia da semana esperado dinamicamente (hoje + 2 dias)
        $expectedDayOfWeek = $futureDate->dayOfWeekIso;
        $this->assertEquals($expectedDayOfWeek, $scheduled->dayOfWeekIso());
    }

    public function test_scheduled_date_time_can_calculate_difference(): void
    {
        $now = Carbon::now();
        $futureDate = $now->copy()->addHours(48);
        $scheduled = ScheduledDateTime::fromString($futureDate->toIso8601String());

        // diffInHours() retorna diferença com sinal (negativo se scheduled < now)
        // Para datas futuras, o valor será negativo, então usamos abs()
        $diff = abs($scheduled->diffInHours($now));
        $this->assertGreaterThanOrEqual(47, $diff); // Deve ser aproximadamente 48 horas (com margem)
        $this->assertLessThanOrEqual(49, $diff); // Com margem de erro
    }
}

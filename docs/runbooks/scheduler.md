## Scheduler Agenda+

### Visão Geral
- Jobs agendados no `app/Console/Kernel.php`:
  - `appointments:send-reminders` (08:00 diária, envia lembretes de consultas para pacientes).
  - `notifications:cleanup` (diária, remove notificações lidas antigas).
- Ambos os comandos utilizam Redis (`QUEUE_CONNECTION=redis`) e as filas padrão do Laravel.

### Execução Manual
- `make schedule-run` – executa todos os jobs agendados apenas uma vez.
- `make reminders` – força o envio imediato de lembretes pendentes.
- `make notifications-clean` – limpa notificações lidas conforme o limite padrão (30 dias).

### Crontab (ambiente sem Supervisor)
```bash
* * * * * cd /var/www/agenda-plus/backend && php artisan schedule:run >> /var/log/agenda-plus/scheduler.log 2>&1
```
- Garante execução minuciosa para o scheduler do Laravel.

### Supervisor (recomendado)
Arquivo exemplo: `/etc/supervisor/conf.d/agenda-plus.conf`
```ini
[program:agenda-plus-schedule]
command=/usr/bin/php /var/www/agenda-plus/backend/artisan schedule:run
directory=/var/www/agenda-plus/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/agenda-plus/schedule.log
startsecs=5

[program:agenda-plus-queue]
command=/usr/bin/php /var/www/agenda-plus/backend/artisan queue:work --tries=3 --sleep=2
directory=/var/www/agenda-plus/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/agenda-plus/queue.log
stopwaitsecs=10
```
- Reiniciar: `sudo supervisorctl reread && sudo supervisorctl update`.

### Observabilidade
- Logs em `/var/log/agenda-plus/*.log`.
- Monitorar falhas via `php artisan queue:failed` e `queue:retry`.



# Deploy em Produção – Agenda+

Este diretório contém a stack Docker orientada a produção, com imagens otimizadas e separação de responsabilidades (_backend_, _frontend_, PostgreSQL e Redis).

## Pré‑requisitos

- Docker 24+
- Docker Compose v2
- Variáveis de ambiente preenchidas (ver arquivos `*.env.example`)

## Passo a passo

1. **Copie e ajuste os arquivos de ambiente**
   ```bash
   cp backend.env.example backend.env
   cp frontend.env.example frontend.env
   ```
   - Gere um `APP_KEY` real com `php -r "echo base64_encode(random_bytes(32));"`.
   - Configure URLs, credenciais e provedores de e-mail/SMS.

2. **Construa e suba a stack**
   ```bash
   docker compose -f docker-compose.yml build
   docker compose -f docker-compose.yml up -d
   ```

3. **Execute migrações e seeders uma única vez**
   ```bash
   docker compose -f docker-compose.yml exec backend php artisan migrate --force
   docker compose -f docker-compose.yml exec backend php artisan db:seed --force
   ```

4. **Verifique os serviços**
   - Backend: `https://SEU_DOMINIO:8000/api/health` (implemente health-check de acordo com sua infra)
   - Frontend: `https://SEU_DOMINIO:3000`
   - Banco: backup/agendamento via `db` container
   - Redis: métricas e filas (`redis-cli` dentro do container)

## Dicas Operacionais

- Configure um _reverse proxy_ (NGINX/Traefik) para TLS, compressão e roteamento externo.
- Use volumes dedicados (`backend-storage`, `backend-logs`, `db-data`, `redis-data`) para persistir dados entre _deploys_.
- Para _rolling updates_, gere imagens com tag (`agenda-plus-backend:vX.Y.Z`) e publique em um registry privado.
- Automatize a execução do `php artisan schedule:run` via cron/Jobs no orquestrador (ver `docs/runbooks/scheduler.md`).
- Utilize variáveis extras (`UID`, `GID`) para alinhar permissões com o host, quando necessário.



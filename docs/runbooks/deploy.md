## Deploy Pipelines

- **CI**: `.github/workflows/ci.yml`
  - Job `backend`: roda `composer install`, `php artisan migrate --force` em PostgreSQL efêmero e executa `php artisan test`.
  - Job `frontend`: executa `npm ci`, lint (`next lint`) e build (`next build`).
  - Job `docker`: garante compilação das imagens multi-stage (`docker/backend`, `docker/frontend`) usando o alvo `production`.

- **Build de Produção**:
  - Local: `make prod-build` ou `docker compose -f deploy/production/docker-compose.yml build`.
  - Publicação: faça login no registry e `docker compose -f deploy/production/docker-compose.yml push`.

- **Deploy Manual**:
  1. Ajuste `deploy/production/backend.env` e `frontend.env` (base nos arquivos `.example`).
  2. `docker compose -f deploy/production/docker-compose.yml up -d`.
  3. `docker compose -f deploy/production/docker-compose.yml exec backend php artisan migrate --force`.

- **Checklists**:
  - Health-checks e métricas descritos em `docs/runbooks/scheduler.md`.
  - Secrets e chaves mantidos fora do repositório (Vault/secret manager).
  - Atualizações seguem versionamento semântico (tag + release notes).



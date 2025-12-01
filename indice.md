# Plano de Implementação – Agenda+

## Sumário
- [0. Diretrizes Gerais](#0-diretrizes-gerais)
- [1. Preparação do Ambiente](#1-preparação-do-ambiente)
- [2. Backend Laravel (API REST)](#2-backend-laravel-api-rest)
- [3. Frontend Next.js](#3-frontend-nextjs)
- [4. Banco de Dados PostgreSQL](#4-banco-de-dados-postgresql)
- [5. Integrações e Serviços de Suporte](#5-integrações-e-serviços-de-suporte)
- [6. Qualidade, Testes e Observabilidade](#6-qualidade-testes-e-observabilidade)
- [7. Segurança e Conformidade](#7-segurança-e-conformidade)
- [8. DevOps, Deploy e Automação](#8-devops-deploy-e-automação)
- [9. Documentação e Entregáveis](#9-documentação-e-entregáveis)
- [10. Roadmap de Execução](#10-roadmap-de-execução)

---

## 0. Diretrizes Gerais
- [ ] Adotar padrões SOLID, Clean Code e Regra do Boy Scout em todo o código.
- [ ] Priorizar simplicidade e consistência de nomenclaturas (KISS & DRY).
- [ ] Garantir alto nível de cobertura de testes (unitários, integração e ponta a ponta).
- [ ] Utilizar versionamento semântico e convenções de commit (Conventional Commits).
- [ ] Centralizar configurações sensíveis em variáveis de ambiente (.env/.env.local).
- [ ] Preparar o projeto para internacionalização futura (texto isolado em arquivos de mensagens).
- [ ] Registrar decisões arquiteturais relevantes (ADR – Architecture Decision Records).

---

## 1. Preparação do Ambiente
### 1.1 Estrutura de Pastas
- [x] Definir estrutura raiz: `backend/`, `frontend/`, `deploy/`, `docs/`, `scripts/`.
- [x] Criar diretórios de suporte (`.github/`, `tests/`, `docker/`, `migrations/`, `seeders/`).

### 1.2 Ferramentas e Dependências Globais
- [x] Definir versões estáveis: PHP 8.3 LTS, Laravel 11.x, Node.js 20.x LTS, Next.js 14.x, PostgreSQL 16.x, Redis 7.x.
- [x] Configurar Docker/Docker Compose com containers independentes (app, db, redis, mailcatcher).
- [x] Configurar Makefile ou scripts PowerShell/Bash para comandos de automação (build, lint, test).
- [ ] Configurar `pre-commit` (lint, formatadores, testes rápidos).

### 1.3 Observabilidade de Desenvolvimento
- [ ] Integrar ferramentas de análise estática (PHPStan/Psalm, ESLint, Stylelint, Prettier, Pylint se necessário).
- [ ] Definir padrão de logs locais (Monolog estruturado, console logger no frontend).
- [ ] Configurar Husky (frontend) para validar lint antes de commits.

---

## 2. Backend Laravel (API REST)
### 2.1 Bootstrap do Projeto
- [x] Criar projeto Laravel (`backend/`) com Sanctum habilitado.
- [x] Configurar `.env.example` com parâmetros padrão (DB, cache, mail, queue).
- [ ] Definir namespaces e providers customizados (Domain, Application, Infra).

### 2.2 Camadas e Módulos
- [ ] Implementar arquitetura hexagonal/DDD light:
  - [ ] `Domain`: entidades, agregados, value objects, serviços de domínio.
  - [ ] `Application`: DTOs, casos de uso, validadores.
  - [ ] `Infrastructure`: repositórios Eloquent, serviços externos, filas.
- [ ] Configurar Service Container para injeção de dependências.

### 2.3 Modelagem de Dados
- [x] Criar migrations conforme MER (`users`, `patients`, `doctors`, `appointments`, `schedules`, `observations`, `health_insurances`, relacionamentos N:M, `notifications`).
- [x] Adicionar índices e constraints (unique, foreign keys, enums).
- [x] Criar seeders/factories para dados iniciais e testes.

### 2.4 Casos de Uso e Endpoints
- [x] Autenticação e gestão de sessão (login, refresh, logout, bloqueio por tentativas).
- [x] Completar fluxo de login conforme requisito (expiração 2h, recuperação de senha, máximo 3 tentativas).
- [x] Cadastro e gestão de usuários (admin, médico, paciente).
- [x] Restringir auto-registro de pacientes e emissão automática de credenciais/e-mail de boas-vindas.
- [x] Gestão de agenda médica (CRUD de schedules, bloqueios).
- [x] Garantir regra de no mínimo 4h semanais e impedir alteração de horários com consultas agendadas.
- [x] Agendamento, cancelamento e remarcação de consultas.
- [x] Implementar filtros por período (futuras / passadas / todas) nas consultas.
- [x] Observações médicas e prontuário.
- [x] Restringir visualização de observações ao médico/admin e versionar histórico de alterações.
- [x] Relatórios administrativos (consulta, pacientes, médicos, ocupação, exportações CSV/JSON).
- [x] Gerar relatórios em PDF incluindo faturamento e arquivamento automático.
- [x] Gestão de convênios (CRUD, vinculação com pacientes/médicos).
- [x] Inativação lógica de convênios e salvaguardas adicionais (impedir agendamentos com convênios inativos).
- [x] Notificações (fila de envio, templates, preferências).
- [x] Logs de auditoria e histórico.

### 2.5 Regras de Negócio e Validações
- [x] Implementar validações server-side (Form Requests, Value Objects).
- [x] Garantir workflow de status de consultas.
- [x] Aplicar políticas de RBAC (gates/policies) para perfis.
- [x] Configurar rate limiting, throttling e proteção contra brute force.
- [x] Formalizar camadas Domain/Application/Infrastructure conforme arquitetura proposta.
- [x] Implementar geração automática de credenciais e envio de e-mail para novos pacientes/médicos.
- [x] Ajustar regras de remarcação/cancelamento especiais (autorização clínica <12h).

### 2.6 Testes Backend
- [ ] Testes unitários (PHPUnit/Pest) para serviços e regras de negócio.
- [ ] Testes de integração (HTTP/Feature) para endpoints críticos.
- [ ] Testes de contrato (OpenAPI + Schemathesis ou equivalente).
- [ ] Cobertura mínima 80% com relatórios (coverage HTML/CI).

---

## 3. Frontend Next.js
### 3.1 Bootstrap do Projeto
- [x] Criar projeto Next.js (`frontend/`) com TypeScript e App Router.
- [x] Configurar ESLint + Prettier + Stylelint + Husky.
- [x] Integrar Tailwind CSS com design system customizado.

### 3.2 Arquitetura de Pastas
- [ ] Estrutura recomendada:
  - `app/` (rotas, layouts, loaders)
  - `modules/` (domínios: auth, scheduling, patients, doctors)
  - `components/` (UI reutilizável)
  - `lib/` (clients, helpers, configs)
  - `store/` (Zustand/TanStack Query configs)
  - `styles/` (tokens, globals)
  - `tests/` (Jest/Testing Library)

### 3.3 Funcionalidades
- [ ] Autenticação com SSR + persistência de sessão (cookies HttpOnly).
- [ ] Dashboards específicos (admin, médico, paciente).
- [ ] Implementar React Query / TanStack Query para cache de dados e sincronização.
- [x] Fluxos completos de agendamento, remarcação e cancelamento.
- [x] Gestão de agendas para médicos (calendário interativo).
- [x] Visualização de histórico e prontuário para perfis autorizados.
- [x] Gestão administrativa (relatórios, convênios, usuários) com filtros, feedbacks e exportações.
- [x] Notificações e alertas (toast, e-mail opt-in/out).
- [ ] Acessibilidade (WCAG AA) e responsividade (mobile-first).
- [ ] Geração de PDF/relatórios formais no frontend quando aplicável.

### 3.4 Comunicação com API
- [x] Configurar Axios (ou Fetch API) com interceptors (tokens, erros).
- [x] Criar camada de serviços tipados com Zod/Yup para validar payloads.
- [ ] Implementar mecanismos de cache/sincronização em tempo real (React Query, websockets) conforme arquitetura.
- [ ] Aplicar optimistic updates quando apropriado.

### 3.5 Testes Frontend
- [ ] Testes unitários com Jest/React Testing Library.
- [ ] Testes de integração (componentes + mocks API).
- [ ] Testes E2E com Playwright ou Cypress.
- [ ] Verificações de acessibilidade automatizadas (axe, Lighthouse).

---

## 4. Banco de Dados PostgreSQL
- [x] Criar scripts de criação (migrations) e seeds conforme MER.
- [ ] Implementar enums nativos, índices, views/materialized views para relatórios.
- [ ] Configurar migrações roll-forward/roll-back e versionamento (Liquibase opcional).
- [ ] Preparar backups automáticos (pg_dump scripts) e restore documentado.
- [x] Garantir políticas de retenção de dados e anonimização (LGPD).
- [ ] Implementar testes de performance (explain analyze) para consultas críticas.
- [ ] Atualizar MER com novas entidades/campos (privacy, notification_preferences, logs).
- [ ] Implementar triggers/stored procedures previstos na documentação.

---

## 5. Integrações e Serviços de Suporte
- [x] Servidor SMTP gratuito (Mailhog/Mailpit) para desenvolvimento; definir provedor gratuito em produção (SendGrid/Resend).
- [x] Configurar Redis para cache e filas (horizon/workers).
- [x] Implementar scheduler (Laravel Scheduler + Supervisor). *(jobs de lembrete e limpeza configurados via `php artisan schedule:run` e Makefile)*
- [x] Definir camada de notificações (template engine, fila, retries).
- [x] Preparar integrações futuras (ex: SMS, Telemedicina) com abstrações. *(provedor SMS stub + bindings)*
- [ ] Implementar cache Redis real, health checks e monitoramento de filas conforme arquitetura.
- [ ] Configurar CDN/serving de assets estáticos conforme documento de arquitetura.

---

## 6. Qualidade, Testes e Observabilidade
- [ ] Configurar pipeline de testes automatizados (backend + frontend).
- [ ] Integrar ferramentas de análise de cobertura (Coveralls/Codecov).
- [x] Instrumentar métricas (Prometheus/OpenTelemetry) e logs estruturados. *(middleware de métricas + canal dedicado)*
- [ ] Configurar monitoramento de erros (Sentry/ErrorBoundary).
- [ ] Implementar feature flags básicos para lançamentos graduais.
- [ ] Implementar health-checks automáticos e alertas de SLA.
- [ ] Criar suíte de testes de carga/performance conforme arquitetura.

---

## 7. Segurança e Conformidade
- [ ] Aplicar OWASP Top 10 (input sanitization, CSRF, XSS, SSRF, segurança de sessão).
- [x] Implementar LGPD: consentimento, opt-in/out, logs de auditoria, anonimização.
- [ ] Gerenciar segredos (dotenv + instruções para Vault/Secret Manager).
- [x] Configurar políticas de senha, MFA opcional, bloqueio automático. *(senha forte + bloqueio temporário por falhas)*
- [ ] Documentar política de retenção de dados e descarte seguro.
- [ ] Rodar testes SAST/DAST antes de releases (laravel-security-checker, npm audit, trivy).
- [x] Implementar recuperação de senha e expiração de sessão conforme requisito.
- [ ] Adequar CSP e monitoramento de sessão às recomendações OWASP (front e back).
- [ ] Formalizar consentimento LGPD por versão e trilha de revisão (documentação + UI).

---

## 8. DevOps, Deploy e Automação
- [x] Criar Docker Compose para desenvolvimento (backend, frontend, db, redis, mail).
- [x] Criar Dockerfiles multi-stage (prod vs dev).
- [x] Configurar ambientes (dev, staging, prod) com variáveis diferenciadas.
- [x] CI/CD (GitHub Actions): lint → test → build → deploy (staging/prod).
- [x] Definir estratégia de deploy (frontend + backend com Docker/Compose e documentação).
- [ ] Automatizar migrações e seeders no deploy.
- [ ] Configurar Infrastructure as Code (Terraform opcional) para produção futura.
- [ ] Implementar backup automático e restore documentado (scripts + agendamento).
- [ ] Configurar balanceamento/monitoramento de disponibilidade conforme arquitetura.

---

## 9. Documentação e Entregáveis
- [ ] Atualizar README principal (setup rápido, scripts, arquitetura resumida).
- [ ] Documentar API com OpenAPI/Swagger + Postman Collection.
- [ ] Criar guia de contribuições (CONTRIBUTING.md) e código de conduta (CODE_OF_CONDUCT.md).
- [ ] Manter changelog (CHANGELOG.md) e release notes.
- [ ] Adicionar documentação de testes (relatórios, como executar).
- [ ] Criar guia de operação (runbooks, checklists de suporte).
- [ ] Registrar ADRs e diagramas atualizados (docs/).

---

## 10. Roadmap de Execução
### Fase 0 – Planejamento
- [ ] Refinar backlog técnico a partir deste índice.
- [ ] Priorizar dependências críticas (autenticação, cadastros base, agenda).
- [ ] Definir milestones e sprints (Kanban/Trello/Jira).

### Fase 1 – Fundamentos
- [x] Montagem do ambiente Docker + scaffolds backend/frontend.
- [x] Migrations, seeders básicos e endpoints de autenticação.
- [x] Layouts principais e fluxo de login no frontend.

### Fase 2 – Núcleo do Produto
- [x] Implementação completa de agendamento e agenda médica.
- [x] Gestão de convênios (CRUD completo via painel admin).
- [x] Gestão de usuários (administra médicos/pacientes, CRUD e perfis).
- [x] Sistema de notificações (fila, templates, canais).
- [x] Observações clínicas e relatórios administrativos.

### Fase 3 – Qualidade e Observabilidade
- [ ] Harden de segurança, testes abrangentes, monitoramento.
- [ ] CI/CD completo e documentação final.
- [ ] Preparação para go-live e checklist de release.

---

> **Observação:** Este índice será atualizado continuamente. Cada item marcado como concluído deve ter commits e documentação associados. Novas tarefas emergentes devem ser registradas aqui antes da implementação para manter rastreabilidade.


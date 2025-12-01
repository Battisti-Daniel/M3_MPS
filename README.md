# Agenda+ - Sistema de Agendamento Médico

Sistema completo de agendamento médico desenvolvido com Laravel (backend) e Next.js (frontend), seguindo as melhores práticas de desenvolvimento de software.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Testes](#testes)
- [Documentação](#documentação)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

O **Agenda+** é um sistema completo de agendamento médico que permite:

- ✅ Agendamento, cancelamento e remarcação de consultas
- ✅ Gestão de agendas médicas
- ✅ Observações clínicas e prontuário
- ✅ Relatórios administrativos (com exportação PDF)
- ✅ Gestão de convênios
- ✅ Sistema de notificações
- ✅ Conformidade LGPD
- ✅ Logs de auditoria

## 🛠 Tecnologias

### Backend
- **Laravel 12** - Framework PHP
- **PHP 8.3** - Linguagem
- **PostgreSQL 16** - Banco de dados
- **Redis 7** - Cache e filas
- **Laravel Sanctum** - Autenticação API
- **Laravel Queue** - Processamento assíncrono

### Frontend
- **Next.js 16** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Axios** - Cliente HTTP
- **React Hook Form** - Formulários
- **Zustand** - Gerenciamento de estado
- **Jest** - Testes unitários

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **GitHub Actions** - CI/CD

## 📦 Requisitos

- Docker e Docker Compose (recomendado)
- Node.js 20+ (para desenvolvimento local)
- PHP 8.3+ (para desenvolvimento local)
- Composer (para desenvolvimento local)

## 🚀 Instalação

### Usando Docker (Recomendado)

1. Clone o repositório:
```bash
git clone https://github.com/Battisti-Daniel/M3_MPS.git
cd M3_MPS
```

2. Inicie os containers:
```bash
docker-compose up -d --build
```

3. Aguarde os containers iniciarem completamente (primeira vez pode levar alguns minutos).

4. Execute as migrações e seeds:
```bash
docker exec agenda_backend php artisan migrate --force
docker exec agenda_backend php artisan db:seed
```

5. Acesse a aplicação:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/api/documentation
- **Mailpit (emails)**: http://localhost:8025
- **PostgreSQL**: localhost:5434 (user: agenda, password: agenda)

### Credenciais de Teste (após seed)

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@agenda.com | password |
| Médico | medico@agenda.com | password |
| Paciente | paciente@agenda.com | password |

### Comandos Úteis Docker

```bash
# Ver logs de todos os containers
docker-compose logs -f

# Ver logs de um container específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar containers
docker-compose restart

# Parar containers
docker-compose down

# Limpar tudo e recomeçar
docker-compose down -v
docker-compose up -d --build
```

### Desenvolvimento Local

#### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Configuração

### Variáveis de Ambiente

As variáveis de ambiente já estão configuradas no `docker-compose.yml` para desenvolvimento. Não é necessário criar arquivos `.env` manualmente quando usando Docker.

#### Backend (configurado automaticamente no Docker)
```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=agenda
DB_USERNAME=agenda
DB_PASSWORD=agenda
REDIS_HOST=redis
REDIS_PORT=6379
MAIL_HOST=mailpit
MAIL_PORT=1025
```

#### Frontend (configurado automaticamente no Docker)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🎮 Uso

### Autenticação

1. Acesse `/login`
2. Use as credenciais do seeder ou crie uma nova conta
3. O token será armazenado automaticamente

### Endpoints Principais

- `POST /api/auth/login` - Login
- `GET /api/appointments` - Listar consultas
- `POST /api/appointments` - Agendar consulta
- `GET /api/doctors` - Listar médicos
- `GET /api/health-insurances` - Listar convênios

Consulte a documentação Swagger em `/api/documentation` para todos os endpoints.

## 🧪 Testes

### Backend (PHPUnit)

```bash
# Executar todos os testes
docker exec agenda_backend php artisan test

# Com cobertura
docker exec agenda_backend php artisan test --coverage

# Testes específicos
docker exec agenda_backend php artisan test --filter AppointmentTest
```

**Status atual**: 98 testes passando ✅

### Frontend (Jest)

```bash
# Executar todos os testes
docker exec agenda_frontend npm test

# Com cobertura
docker exec agenda_frontend npm test -- --coverage --watchAll=false

# Modo watch (desenvolvimento local)
cd frontend && npm run test:watch
```

**Status atual**: 490 testes passando ✅ | Cobertura: 70.75%

### Cobertura de Testes

| Área | Cobertura |
|------|-----------|
| Backend | ~96% (98 testes) |
| Frontend - Services | 99% |
| Frontend - Hooks | 100% |
| Frontend - Stores | 100% |
| Frontend - Total | 70.75% |

## 📚 Documentação

- [Documentação da API (Swagger)](http://localhost:8000/api/documentation) - Disponível após iniciar o backend
- [Autenticação](./backend/AUTENTICACAO.md)
- [Guia de Testes](./backend/tests/README_TESTS.md)
- [Documentação de Deploy](./deploy/production/README.md)
- [Runbooks](./docs/runbooks/)

## 🔧 Solução de Problemas

### Container não inicia
```bash
# Verifique os logs
docker-compose logs -f backend

# Recrie os containers
docker-compose down -v
docker-compose up -d --build
```

### Erro de migração
```bash
# Limpe o banco e rode novamente
docker exec agenda_backend php artisan migrate:fresh --seed
```

### Frontend não conecta ao backend
Verifique se o backend está rodando e acessível em http://localhost:8000/api/health/ping

### Jobs não executam (Redis)
```bash
# Verifique o container Redis
docker exec agenda_redis redis-cli ping
# Deve retornar: PONG

# Processe jobs manualmente
docker exec agenda_backend php artisan queue:work --once
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Siga os padrões PSR-12 (PHP) e ESLint (TypeScript)
- Escreva testes para novas funcionalidades
- Mantenha a cobertura de testes acima de 70%
- Documente mudanças significativas

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Battisti-Daniel** - [GitHub](https://github.com/Battisti-Daniel)

---

**Agenda+** - Sistema de Agendamento Médico © 2025


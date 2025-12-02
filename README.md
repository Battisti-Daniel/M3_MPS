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

2. Configure as variáveis de ambiente:
```bash
cp backend/.env.example backend/.env
```

3. Gere o arquivo `package-lock.json` do frontend (necessário para o Docker):
```bash
cd frontend
npm install --package-lock-only --legacy-peer-deps
cd ..
```

4. Inicie os containers:
```bash
docker-compose up -d --build
```

> **Nota (Windows PowerShell):** O comando pode exibir texto em vermelho e "exit code 1", mas isso é um falso positivo do PowerShell. Verifique se os containers estão rodando com `docker ps`.

5. Execute as migrações:
```bash
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan db:seed
```

6. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/api/documentation
- Mailpit: http://localhost:8025

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

## 🔧 Troubleshooting

### Falso positivo de erro no PowerShell (Windows)

Ao executar `docker-compose up -d --build` no Windows PowerShell, você pode ver mensagens em vermelho e "exit code 1", mesmo quando tudo funcionou corretamente. Isso acontece porque o PowerShell interpreta qualquer output em stderr como erro.

**Como verificar se funcionou:**
```powershell
docker ps
```
Se os containers estiverem listados com status "Up", está tudo funcionando!

### Erro: `package-lock.json not found` ao rodar Docker

Se ao executar `docker-compose up -d --build` você receber o erro:
```
failed to compute cache key: "/frontend/package-lock.json": not found
```

**Solução:** Gere o arquivo `package-lock.json` antes de construir os containers:
```bash
cd frontend
npm install --package-lock-only --legacy-peer-deps
cd ..
docker-compose up -d --build
```

### Containers não iniciam corretamente

1. Verifique se as portas necessárias estão disponíveis:
   - 3000 (Frontend)
   - 8000 (Backend)
   - 5434 (PostgreSQL)
   - 6379 (Redis)
   - 1025, 8025 (Mailpit)

2. Limpe os containers e volumes antigos:
```bash
docker-compose down -v
docker-compose up -d --build
```

### Erro de permissões no backend

Se ocorrerem erros de permissão no Laravel:
```bash
docker-compose exec backend chmod -R 775 storage bootstrap/cache
docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
```

### Verificar logs dos containers

```bash
# Logs de todos os containers
docker-compose logs

# Logs de um container específico
docker-compose logs backend
docker-compose logs frontend
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Battisti-Daniel** - [GitHub](https://github.com/Battisti-Daniel)

---

**Agenda+** - Sistema de Agendamento Médico © 2025


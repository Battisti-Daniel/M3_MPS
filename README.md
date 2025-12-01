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
- **PHP 8.2+** - Linguagem
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

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **GitHub Actions** - CI/CD

## 📦 Requisitos

- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)
- PHP 8.2+ (para desenvolvimento local)
- Composer (para desenvolvimento local)

## 🚀 Instalação

### Usando Docker (Recomendado)

1. Clone o repositório:
```bash
git clone <repository-url>
cd "app agenda+"
```

2. Configure as variáveis de ambiente:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Inicie os containers:
```bash
docker-compose up -d
```

4. Execute as migrações:
```bash
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan db:seed
```

5. Acesse a aplicação:
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

#### Backend (.env)
```env
APP_NAME="Agenda+"
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

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
```

#### Frontend (.env.local)
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

### Backend

```bash
# Todos os testes
cd backend
php artisan test

# Com cobertura
php artisan test --coverage

# Testes específicos
php artisan test --filter AppointmentTest
```

### Frontend

```bash
# Todos os testes
cd frontend
npm test

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

### Cobertura Mínima

- Backend: 70%
- Frontend: 70%

## 📚 Documentação

- [Documentação da API](./backend/AUTENTICACAO.md)
- [Guia de Testes](./backend/tests/README_TESTS.md)
- [Documentação de Deploy](./deploy/production/README.md)
- [Runbooks](./docs/runbooks/)

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

- **Equipe de Desenvolvimento** - [GitHub](https://github.com)

## 🙏 Agradecimentos

- Laravel Framework
- Next.js Team
- Comunidade Open Source

---


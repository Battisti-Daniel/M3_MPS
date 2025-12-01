# Guia de Contribuição - Agenda+

Obrigado por considerar contribuir com o Agenda+! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Commits](#commits)
- [Pull Requests](#pull-requests)

## 📜 Código de Conduta

Este projeto segue um Código de Conduta. Ao participar, você concorda em manter este código.

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/agenda-plus.git
cd agenda-plus
```

### 2. Criar Branch

```bash
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### 3. Fazer Mudanças

- Siga os padrões de código
- Escreva testes
- Atualize documentação se necessário

### 4. Commitar

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

### 5. Push e Pull Request

```bash
git push origin feature/nome-da-feature
# Criar PR no GitHub
```

## 💻 Padrões de Código

### Backend (PHP/Laravel)

- Siga **PSR-12** para estilo de código
- Use **Laravel Pint** para formatação automática
- Nomes descritivos e em inglês
- Comentários em português quando necessário
- Máximo de 120 caracteres por linha

```bash
# Formatar código
cd backend
vendor/bin/pint
```

### Frontend (TypeScript/React)

- Siga as regras do **ESLint**
- Use **TypeScript** para tipagem
- Componentes funcionais com hooks
- Nomes descritivos e em inglês

```bash
# Verificar código
cd frontend
npm run lint
```

## 🧪 Testes

### Requisitos

- **Cobertura mínima: 70%**
- Testes unitários para lógica de negócio
- Testes de integração para endpoints
- Testes E2E para fluxos críticos

### Backend

```bash
cd backend
php artisan test --coverage
```

### Frontend

```bash
cd frontend
npm run test:coverage
```

## 📝 Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

### Tipos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

### Exemplos

```bash
feat: adiciona sistema de notificações
fix: corrige validação de CPF
docs: atualiza README
refactor: melhora AppointmentService
test: adiciona testes para CacheManager
```

## 🔍 Pull Requests

### Checklist

- [ ] Código segue os padrões
- [ ] Testes passam
- [ ] Cobertura mantida ou aumentada
- [ ] Documentação atualizada
- [ ] Sem conflitos com main

### Template

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
Passos para testar as mudanças

## Screenshots (se aplicável)
```

## 🐛 Reportar Bugs

Use o template de issue do GitHub:

- Descrição clara
- Passos para reproduzir
- Comportamento esperado vs atual
- Ambiente (OS, versões)

## 💡 Sugerir Funcionalidades

- Descreva o problema que resolve
- Explique a solução proposta
- Mostre exemplos de uso

## 📞 Dúvidas?

Abra uma issue ou entre em contato com os mantenedores.

---

**Obrigado por contribuir! 🎉**


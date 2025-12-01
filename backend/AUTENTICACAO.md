# Guia de Autenticação - Agenda+ API

## Visão Geral

A API Agenda+ utiliza **Laravel Sanctum** para autenticação via tokens Bearer. O processo é simples e seguro.

## Fluxo de Autenticação

### 1. Realizar Login

**Endpoint:** `POST /api/auth/login`

**Requisição:**
```json
{
  "email": "paciente@example.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "token": "1|abcdef1234567890abcdef1234567890",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "paciente@example.com",
    "role": "PATIENT",
    ...
  }
}
```

**Respostas de Erro:**
- `401 Unauthorized` - Credenciais inválidas
- `429 Too Many Requests` - Conta bloqueada após 3 tentativas falhas (bloqueio de 30 minutos)

### 2. Usar o Token nas Requisições

Após obter o token, inclua-o no header `Authorization` de todas as requisições autenticadas:

```
Authorization: Bearer 1|abcdef1234567890abcdef1234567890
```

**Exemplo com cURL:**
```bash
curl -X GET "http://localhost:8000/api/appointments" \
  -H "Authorization: Bearer 1|abcdef1234567890abcdef1234567890" \
  -H "Accept: application/json"
```

**Exemplo com JavaScript (Fetch API):**
```javascript
fetch('http://localhost:8000/api/appointments', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer 1|abcdef1234567890abcdef1234567890',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

**Exemplo com Axios:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Após login, configure o token
const token = '1|abcdef1234567890abcdef1234567890';
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Agora todas as requisições incluirão o token automaticamente
api.get('/appointments').then(response => {
  console.log(response.data);
});
```

### 3. Verificar Usuário Autenticado

**Endpoint:** `GET /api/auth/me`

Retorna os dados completos do usuário autenticado, incluindo relacionamentos (paciente, médico, convênios).

**Requisição:**
```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Accept: application/json"
```

### 4. Encerrar Sessão (Logout)

**Endpoint:** `POST /api/auth/logout`

Invalida o token atual, fazendo com que ele não possa mais ser usado.

**Requisição:**
```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Accept: application/json"
```

## Recuperação de Senha

### Solicitar Link de Recuperação

**Endpoint:** `POST /api/auth/password/forgot`

**Requisição:**
```json
{
  "email": "usuario@example.com"
}
```

### Redefinir Senha

**Endpoint:** `POST /api/auth/password/reset`

**Requisição:**
```json
{
  "token": "token_recebido_por_email",
  "email": "usuario@example.com",
  "password": "novaSenha123",
  "password_confirmation": "novaSenha123"
}
```

## Segurança

### Proteções Implementadas

1. **Bloqueio por Tentativas Falhas**
   - Após 3 tentativas de login falhas, a conta é bloqueada por 30 minutos
   - O contador é resetado após login bem-sucedido

2. **Expiração de Token**
   - Tokens expiram após 2 horas de inatividade
   - Após expiração, é necessário fazer login novamente

3. **Política de Senha**
   - Mínimo de 8 caracteres
   - Aplicada em todos os pontos de criação/atualização de senha

4. **Rate Limiting**
   - Endpoint de login: limitado para prevenir brute force
   - Endpoints autenticados: limitados para prevenir abuso

### Middleware de Autenticação

Todos os endpoints protegidos utilizam os seguintes middlewares:
- `auth:sanctum` - Verifica se o token é válido
- `active` - Verifica se a conta está ativa
- `audit` - Registra ações para auditoria
- `throttle:api` - Limita taxa de requisições

## Endpoints Públicos (Não Requerem Autenticação)

- `POST /api/auth/login` - Login
- `POST /api/auth/password/forgot` - Solicitar recuperação de senha
- `POST /api/auth/password/reset` - Redefinir senha
- `GET /api/doctors` - Listar médicos
- `GET /api/doctors/{id}` - Ver detalhes de médico
- `GET /api/health-insurances` - Listar convênios ativos

## Endpoints Protegidos (Requerem Autenticação)

Todos os outros endpoints requerem o header `Authorization: Bearer {token}`.

## Exemplo Completo de Fluxo

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    email: 'paciente@example.com',
    password: 'senha123'
  })
});

const { token, user } = await loginResponse.json();
console.log('Token recebido:', token);
console.log('Usuário:', user);

// 2. Usar o token para acessar recursos protegidos
const appointmentsResponse = await fetch('http://localhost:8000/api/appointments', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});

const appointments = await appointmentsResponse.json();
console.log('Consultas:', appointments);

// 3. Verificar usuário autenticado
const meResponse = await fetch('http://localhost:8000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});

const currentUser = await meResponse.json();
console.log('Usuário atual:', currentUser);

// 4. Logout
await fetch('http://localhost:8000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});
```

## Testando no Swagger UI

1. Acesse `http://localhost:8000/api/documentation`
2. Clique no endpoint `POST /api/auth/login`
3. Clique em "Try it out"
4. Preencha email e senha
5. Clique em "Execute"
6. Copie o token retornado
7. Clique no botão "Authorize" no topo da página
8. Cole o token no campo (sem o prefixo "Bearer")
9. Agora você pode testar todos os endpoints autenticados

## Notas Importantes

- O token deve ser incluído em **todas** as requisições a endpoints protegidos
- Tokens expiram após 2 horas
- Após logout, o token não pode mais ser usado
- Mantenha o token seguro e não o compartilhe
- Use HTTPS em produção para proteger o token em trânsito


# Como Autenticar no Swagger UI - Agenda+ API

## Passo a Passo

### 1. Acessar a Documentação Swagger

1. Inicie o servidor Laravel:
   ```bash
   php artisan serve
   ```

2. Acesse no navegador:
   ```
   http://localhost:8000/api/documentation
   ```

### 2. Obter o Token de Autenticação

1. Na interface Swagger, encontre a seção **"Autenticação"** (ou procure pelo endpoint `POST /api/auth/login`)

2. Clique no endpoint `POST /api/auth/login` para expandir

3. Clique no botão **"Try it out"** (no canto superior direito do endpoint)

4. Preencha os campos:
   ```json
   {
     "email": "seu-email@example.com",
     "password": "sua-senha"
   }
   ```

5. Clique no botão **"Execute"** (botão azul na parte inferior)

6. Na resposta, copie o valor do campo `token`:
   ```json
   {
     "token": "1|abcdef1234567890abcdef1234567890",
     "user": { ... }
   }
   ```

### 3. Configurar a Autenticação no Swagger

1. No topo da página Swagger, procure pelo botão **"Authorize"** (🔒) ou **"Authorize"**

2. Clique no botão **"Authorize"**

3. Uma janela modal será aberta com o campo para o token

4. No campo **"Value"**, cole o token que você copiou (apenas o token, sem a palavra "Bearer"):
   ```
   1|abcdef1234567890abcdef1234567890
   ```

5. Clique em **"Authorize"**

6. Clique em **"Close"** para fechar a janela

### 4. Testar Endpoints Protegidos

Agora você pode testar qualquer endpoint que requer autenticação:

1. Expanda qualquer endpoint protegido (ex: `GET /api/appointments`)

2. Clique em **"Try it out"**

3. Clique em **"Execute"**

4. A requisição será enviada automaticamente com o token de autenticação no header

### 5. Verificar se Está Autenticado

Para verificar se a autenticação está funcionando:

1. Expanda o endpoint `GET /api/auth/me`

2. Clique em **"Try it out"**

3. Clique em **"Execute"**

4. Se retornar os dados do usuário, a autenticação está funcionando corretamente

### 6. Fazer Logout (Opcional)

Para invalidar o token:

1. Expanda o endpoint `POST /api/auth/logout`

2. Clique em **"Try it out"**

3. Clique em **"Execute"**

4. O token será invalidado e não poderá mais ser usado

## Visualização no Swagger

### Antes de Autenticar
- Endpoints protegidos mostrarão um ícone de cadeado 🔒
- Ao tentar executar, retornará erro `401 Unauthorized`

### Depois de Autenticar
- O ícone de cadeado ficará desbloqueado
- Você verá um círculo verde ao lado do botão "Authorize" indicando que está autenticado
- Endpoints protegidos funcionarão normalmente

## Dicas Importantes

1. **Token Expira em 2 Horas**
   - Após 2 horas, o token expira
   - Você precisará fazer login novamente e atualizar o token no Swagger

2. **Múltiplos Tokens**
   - Você pode ter múltiplos tokens ativos
   - Cada login gera um novo token
   - Tokens antigos continuam válidos até expirarem

3. **Limpar Autenticação**
   - Para remover a autenticação, clique em **"Authorize"** novamente
   - Clique em **"Logout"** ou **"Unauthorize"** para remover o token

4. **Erro 401**
   - Se receber erro 401, verifique se:
     - O token foi colado corretamente (sem espaços extras)
     - O token não expirou (faça login novamente)
     - Você clicou em "Authorize" após colar o token

## Exemplo Visual do Fluxo

```
1. Swagger UI → Seção "Autenticação"
2. POST /api/auth/login → "Try it out"
3. Preencher email e senha → "Execute"
4. Copiar o token da resposta
5. Clicar em "Authorize" (topo da página)
6. Colar o token → "Authorize" → "Close"
7. Agora todos os endpoints protegidos funcionam!
```

## Troubleshooting

### Token não está funcionando
- Verifique se copiou o token completo (sem quebras de linha)
- Tente fazer logout e login novamente
- Verifique se o servidor está rodando

### Botão "Authorize" não aparece
- Verifique se está acessando `/api/documentation`
- Limpe o cache do navegador
- Tente em outro navegador

### Erro 429 (Too Many Requests)
- Você fez muitas tentativas de login
- Aguarde alguns minutos ou use outra conta

### Erro 401 mesmo com token
- O token pode ter expirado (2 horas)
- Faça login novamente e atualize o token
- Verifique se não há espaços extras no token


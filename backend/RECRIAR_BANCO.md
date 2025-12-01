# Como Recriar o Banco de Dados

## Passo a Passo

### 1. Limpar o banco de dados atual

```bash
cd "app agenda+/backend"
php artisan migrate:fresh
```

Este comando irá:
- Dropar todas as tabelas
- Recriar todas as tabelas do zero
- Executar todas as migrations em ordem

### 2. Popular com dados de teste (opcional)

```bash
php artisan db:seed
```

### 3. Verificar se tudo está funcionando

```bash
php artisan migrate:status
```

## Comandos Úteis

### Recriar banco e popular dados
```bash
php artisan migrate:fresh --seed
```

### Recriar apenas o banco (sem seeders)
```bash
php artisan migrate:fresh
```

### Ver status das migrations
```bash
php artisan migrate:status
```

## Nota Importante

⚠️ **ATENÇÃO**: O comando `migrate:fresh` irá **APAGAR TODOS OS DADOS** do banco de dados. Use apenas em ambiente de desenvolvimento!

## Soft Deletes Implementados

Agora todas as tabelas principais têm soft deletes:
- ✅ `users`
- ✅ `patients`
- ✅ `doctors`
- ✅ `health_insurances`
- ✅ `appointments`
- ✅ `schedules`
- ✅ `observations`

Isso significa que quando você "deletar" um registro, ele não será removido fisicamente do banco, apenas marcado como deletado com a coluna `deleted_at` preenchida.


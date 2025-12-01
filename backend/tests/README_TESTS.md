# Testes de Integração - Agenda+

Este documento descreve os testes de integração implementados para o sistema Agenda+.

## 📋 Estrutura de Testes

### Testes Implementados

1. **AuthTest.php** - Autenticação e autorização
   - Login com sucesso
   - Bloqueio após 3 tentativas
   - Recuperação de senha
   - Logout

2. **AppointmentTest.php** - Agendamento de consultas
   - Criação de agendamento
   - Validação de antecedência mínima (24h)
   - Cancelamento e remarcação
   - Limite de remarcações
   - Listagem e filtros

3. **ScheduleTest.php** - Gestão de agendas
   - Criação de horários
   - Validação de mínimo 4h semanais
   - Proteção contra remoção com consultas
   - Validação de sobreposição

4. **ReportTest.php** - Relatórios administrativos
   - Relatório de consultas
   - Relatório de ocupação
   - Relatório de faturamento
   - Relatório de convênios
   - Geração de PDFs
   - Cache de relatórios

5. **ObservationTest.php** - Observações clínicas
   - Registro de observações
   - Privacidade de dados
   - Validações

6. **HealthCheckTest.php** - Health checks
   - Endpoint de health check completo
   - Endpoint ping
   - Verificação de serviços

7. **AdminPatientTest.php** - Administração de pacientes
   - Cadastro de pacientes
   - Listagem
   - Atualização
   - Validações de CPF único

8. **NotificationTest.php** - Notificações
   - Listagem de notificações
   - Marcar como lida
   - Criação automática

9. **CacheTest.php** - Sistema de cache
   - Cache em relatórios
   - Cache em listagens
   - Limpeza de cache

10. **BackupCommandTest.php** - Comandos de backup
    - Comando de backup
    - Comando de arquivamento

## 🚀 Como Executar

### Executar todos os testes
```bash
php artisan test
```

### Executar testes específicos
```bash
php artisan test --filter AuthTest
php artisan test --filter AppointmentTest
```

### Executar com cobertura
```bash
php artisan test --coverage
```

### Executar apenas testes de integração
```bash
php artisan test tests/Feature
```

## 📊 Cobertura de Testes

### Casos de Uso Cobertos

- ✅ CSU01 - Cadastrar Paciente
- ✅ CSU02 - Realizar Login
- ✅ CSU03 - Agendar Consulta
- ✅ CSU04 - Cancelar/Remarcar Consulta
- ✅ CSU05 - Visualizar Consultas
- ✅ CSU06 - Cadastrar e Gerenciar Agenda
- ✅ CSU07 - Registrar Observações
- ✅ CSU08 - Emitir Relatórios Administrativos
- ✅ CSU09 - Gerenciar Médicos e Convênios
- ✅ CSU10 - Enviar Notificações

### Requisitos Não Funcionais Cobertos

- ✅ Cache Redis
- ✅ Health Checks
- ✅ Backups
- ✅ Validações de segurança
- ✅ Regras de negócio

## 🔧 Configuração

Os testes usam:
- **Banco de dados:** SQLite em memória (`:memory:`)
- **Cache:** Array (para testes)
- **Queue:** Sync (síncrono)

## 📝 Notas Importantes

1. **Factories:** Os testes dependem de factories para criar dados de teste
2. **RefreshDatabase:** Todos os testes usam `RefreshDatabase` para garantir isolamento
3. **Cache:** Em testes, o cache é limpo antes de cada teste
4. **Autenticação:** Usa `actingAs()` para simular usuários autenticados

## 🎯 Próximos Passos

Para aumentar a cobertura:
1. Adicionar testes de edge cases
2. Testes de performance
3. Testes de carga
4. Testes E2E com frontend


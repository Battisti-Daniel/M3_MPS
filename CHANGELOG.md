# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- Sistema de cache otimizado com CacheManager
- Testes unitários para AppointmentService
- Testes unitários para CacheManager
- Sistema centralizado de tratamento de erros no frontend
- CI/CD com GitHub Actions
- Testes no frontend (Jest + React Testing Library)
- Documentação completa (README, CONTRIBUTING, CHANGELOG)
- Interceptor de erros melhorado no Axios

### Melhorado
- Sistema de cache (substituído Cache::flush() por cache tags/patterns)
- Tratamento de erros centralizado no frontend
- Documentação da API
- Estrutura de testes

### Corrigido
- Cache flush muito agressivo em produção
- Tratamento de erros inconsistente no frontend

## [1.0.0] - 2024-12-XX

### Adicionado
- Sistema completo de agendamento médico
- Autenticação com Laravel Sanctum
- Gestão de usuários (admin, médico, paciente)
- Agendamento, cancelamento e remarcação de consultas
- Gestão de agendas médicas
- Observações clínicas
- Relatórios administrativos (com PDF)
- Gestão de convênios
- Sistema de notificações
- Conformidade LGPD
- Logs de auditoria
- Testes de integração
- Docker Compose para desenvolvimento
- Documentação Swagger/OpenAPI

---

## Tipos de Mudanças

- **Adicionado** para novas funcionalidades
- **Modificado** para mudanças em funcionalidades existentes
- **Descontinuado** para funcionalidades que serão removidas
- **Removido** para funcionalidades removidas
- **Corrigido** para correções de bugs
- **Segurança** para vulnerabilidades


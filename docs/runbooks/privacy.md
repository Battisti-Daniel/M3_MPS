## Governança de Privacidade

- **Consentimento**: aceito via `POST /api/privacy/accept`, persistido em `users.privacy_policy_accepted_at` + versão atual.
- **Exportação de dados**: `GET /api/privacy/export` retorna JSON com dados pessoais agregados.
- **Solicitação de exclusão**: `POST /api/privacy/request-erasure` agenda `AnonymizeUserJob` na fila `maintenance`.
- **Campos adicionados**:
  - `privacy_policy_accepted_at`
  - `privacy_policy_version`
  - `data_erasure_requested_at`
- **Processo de anonimização**:
  - Desativa usuário e remove PII (nome, email, telefone).
  - Limpa informações sensíveis de `patient` e `doctor`.
  - Mantém histórico mínimo para auditoria.
- **Armazenamento de preferências**: tabela `notification_preferences`, endpoints `GET/PUT /api/notifications/preferences`.



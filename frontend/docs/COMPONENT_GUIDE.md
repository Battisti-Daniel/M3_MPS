# Guia de Componentes - Agenda+

Este documento descreve os componentes reutilizáveis do sistema e como utilizá-los.

## Componentes UI

### Button

Botão reutilizável com variantes.

```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost">Ver mais</Button>
```

**Variantes:**
- `primary`: Botão principal (roxo)
- `secondary`: Botão secundário (cinza)
- `ghost`: Botão transparente

### Card

Container para agrupar conteúdo relacionado.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo aqui
  </CardContent>
</Card>
```

### StatusBadge

Badge para exibir status de forma consistente.

```tsx
import { StatusBadge } from '@/components/ui/status-badge';

<StatusBadge status="CONFIRMED" />
<StatusBadge status="PENDING" />
<StatusBadge status="CANCELLED" />
```

**Status suportados:**
- `PENDING`: Pendente (amarelo)
- `CONFIRMED`: Confirmada (verde)
- `COMPLETED`: Concluída (azul)
- `CANCELLED`: Cancelada (vermelho)
- `BLOCKED`: Bloqueada (cinza)

### ResponsiveTable

Tabela que se converte em cards em mobile.

```tsx
import { ResponsiveTable } from '@/components/ui/responsive-table';

<ResponsiveTable
  data={appointments}
  columns={[
    { key: 'date', label: 'Data', render: (item) => formatDate(item.date) },
    { key: 'doctor', label: 'Médico', render: (item) => item.doctor.name },
    { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ]}
  keyExtractor={(item) => item.id}
  emptyMessage="Nenhuma consulta encontrada"
  loading={loading}
  onRowClick={(item) => handleClick(item)}
/>
```

## Hooks Customizados

### useAsync

Gerencia estados assíncronos (loading, error, data).

```tsx
import { useAsync } from '@/hooks/useAsync';

const { data, loading, error, execute } = useAsync(async () => {
  return await fetchData();
});

useEffect(() => {
  execute();
}, []);
```

### useAppointments

Hook específico para gerenciar consultas.

```tsx
import { useAppointments } from '@/hooks/useAppointments';

const { appointments, loading, error, reload } = useAppointments({
  per_page: 20,
  status: 'CONFIRMED',
  autoLoad: true,
});
```

## Constantes

### Cores

```tsx
import { PRIMARY_COLORS, STATUS_COLORS, getStatusColors } from '@/constants/colors';

// Usar cores primárias
className={`bg-${PRIMARY_COLORS[600]}`}

// Obter cores de status
const colors = getStatusColors('CONFIRMED');
```

### Espaçamento

```tsx
import { SPACING } from '@/constants/spacing';

<div className={SPACING.card}>
<div className={SPACING.section}>
```

## Padrões de Código

### Nomenclatura

- **Componentes**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useAppointments.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`STATUS_COLORS`)
- **Funções**: camelCase (`handleSubmit`, `fetchData`)

### Estrutura de Arquivos

```
components/
  ui/           # Componentes reutilizáveis básicos
  layout/       # Componentes de layout
  providers/    # Context providers
hooks/          # Hooks customizados
constants/      # Constantes e configurações
services/       # Serviços de API
```

### Tratamento de Erros

Sempre use `handleApiError`:

```tsx
import { handleApiError } from '@/lib/handle-api-error';

try {
  await createAppointment(data);
} catch (error) {
  handleApiError(error, 'Erro ao criar consulta');
}
```

### Loading States

Use o componente `Skeleton`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

{loading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <Content />
)}
```

## Responsividade

### Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Padrões

- Use `hidden md:block` para ocultar em mobile
- Use `md:flex` para layout flex em desktop
- Use `ResponsiveTable` para tabelas
- Use `MobileMenu` para navegação mobile

## Acessibilidade

- Sempre adicione `aria-label` em botões sem texto
- Use `role` quando apropriado
- Garanta contraste adequado (WCAG AA)
- Suporte navegação por teclado
- Use `focus-visible` para indicadores de foco


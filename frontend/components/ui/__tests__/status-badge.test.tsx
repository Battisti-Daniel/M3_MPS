import { render, screen } from '@testing-library/react';
import { StatusBadge, getStatusLabel } from '../status-badge';

describe('StatusBadge', () => {
  it('deve renderizar status PENDING', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('deve renderizar status CONFIRMED', () => {
    render(<StatusBadge status="CONFIRMED" />);
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  it('deve renderizar status COMPLETED', () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText('Concluída')).toBeInTheDocument();
  });

  it('deve renderizar status CANCELLED', () => {
    render(<StatusBadge status="CANCELLED" />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  it('deve ter role="status" para acessibilidade', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('deve ter aria-label com o status', () => {
    render(<StatusBadge status="CONFIRMED" />);
    expect(screen.getByLabelText('Status: Confirmada')).toBeInTheDocument();
  });
});

describe('getStatusLabel', () => {
  it('deve retornar label correto para PENDING', () => {
    expect(getStatusLabel('PENDING')).toBe('Pendente');
  });

  it('deve retornar status original se não encontrar label', () => {
    expect(getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('deve funcionar com case insensitive', () => {
    expect(getStatusLabel('pending')).toBe('Pendente');
  });
});


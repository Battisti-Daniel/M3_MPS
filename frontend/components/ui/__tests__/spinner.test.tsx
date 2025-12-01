import { render, screen } from '@testing-library/react';
import { Spinner } from '../spinner';

describe('Spinner', () => {
  describe('renderização básica', () => {
    it('deve renderizar spinner', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('deve ter texto de acessibilidade', () => {
      render(<Spinner />);
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve ter aria-label', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Carregando');
    });
  });

  describe('tamanhos', () => {
    it('deve aplicar tamanho sm', () => {
      render(<Spinner size="sm" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('h-4', 'w-4');
    });

    it('deve aplicar tamanho md por padrão', () => {
      render(<Spinner data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('h-6', 'w-6');
    });

    it('deve aplicar tamanho lg', () => {
      render(<Spinner size="lg" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('h-8', 'w-8');
    });
  });

  describe('variantes', () => {
    it('deve aplicar variante primary por padrão', () => {
      render(<Spinner data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('text-purple-600');
    });

    it('deve aplicar variante secondary', () => {
      render(<Spinner variant="secondary" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('text-slate-600');
    });

    it('deve aplicar variante white', () => {
      render(<Spinner variant="white" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('text-white');
    });
  });

  describe('classes adicionais', () => {
    it('deve aceitar className', () => {
      render(<Spinner className="custom-spinner" data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('custom-spinner');
    });

    it('deve ter classe de animação', () => {
      render(<Spinner data-testid="spinner" />);
      expect(screen.getByTestId('spinner')).toHaveClass('animate-spin');
    });
  });
});

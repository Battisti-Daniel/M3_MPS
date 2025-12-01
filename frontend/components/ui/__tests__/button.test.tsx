import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('deve renderizar com texto', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByText('Clique aqui')).toBeInTheDocument();
  });

  it('deve aplicar variante primary por padrão', () => {
    const { container } = render(<Button>Botão</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('deve aplicar variante secondary', () => {
    const { container } = render(<Button variant="secondary">Botão</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-slate-100');
  });

  it('deve aplicar variante ghost', () => {
    const { container } = render(<Button variant="ghost">Botão</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-transparent');
  });

  it('deve estar desabilitado quando disabled', () => {
    render(<Button disabled>Botão</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('deve chamar onClick quando clicado', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Botão</Button>);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});


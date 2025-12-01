import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  describe('Card base', () => {
    it('deve renderizar card', () => {
      render(<Card data-testid="card">Conteúdo</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    });

    it('deve aceitar className', () => {
      render(<Card className="custom-card" data-testid="card">Conteúdo</Card>);
      expect(screen.getByTestId('card')).toHaveClass('custom-card');
    });
  });

  describe('CardHeader', () => {
    it('deve renderizar header', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('deve aceitar className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('deve renderizar título', () => {
      render(<CardTitle>Meu Título</CardTitle>);
      expect(screen.getByText('Meu Título')).toBeInTheDocument();
    });

    it('deve ser um h3', () => {
      render(<CardTitle>Título</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('deve aceitar className', () => {
      render(<CardTitle className="custom-title">Título</CardTitle>);
      expect(screen.getByText('Título')).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('deve renderizar descrição', () => {
      render(<CardDescription>Descrição do card</CardDescription>);
      expect(screen.getByText('Descrição do card')).toBeInTheDocument();
    });

    it('deve aceitar className', () => {
      render(<CardDescription className="custom-desc">Descrição</CardDescription>);
      expect(screen.getByText('Descrição')).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('deve renderizar conteúdo', () => {
      render(<CardContent data-testid="content">Conteúdo interno</CardContent>);
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo interno')).toBeInTheDocument();
    });

    it('deve aceitar className', () => {
      render(<CardContent className="custom-content" data-testid="content">Conteúdo</CardContent>);
      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('deve renderizar footer', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('deve aceitar className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });
  });

  describe('composição completa', () => {
    it('deve renderizar card completo', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Uma descrição detalhada</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Conteúdo principal do card</p>
          </CardContent>
          <CardFooter>
            <button>Ação</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('full-card')).toBeInTheDocument();
      expect(screen.getByText('Título do Card')).toBeInTheDocument();
      expect(screen.getByText('Uma descrição detalhada')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo principal do card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument();
    });
  });
});

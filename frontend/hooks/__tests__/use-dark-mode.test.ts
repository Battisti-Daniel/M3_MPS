/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '../use-dark-mode';

describe('useDarkMode', () => {
  beforeEach(() => {
    // Limpa localStorage e classe dark antes de cada teste
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('estado inicial', () => {
    it('deve iniciar com isDark false', () => {
      const { result } = renderHook(() => useDarkMode());
      expect(result.current.isDark).toBe(false);
    });

    it('deve iniciar com mounted false e depois true', async () => {
      const { result, rerender } = renderHook(() => useDarkMode());
      
      // Após o useEffect, mounted deve ser true
      rerender();
      expect(result.current.mounted).toBe(true);
    });
  });

  describe('inicialização com localStorage', () => {
    it('deve usar modo claro por padrão quando localStorage está vazio', () => {
      const { result } = renderHook(() => useDarkMode());
      
      expect(result.current.isDark).toBe(false);
      expect(localStorage.getItem('darkMode')).toBe('false');
    });

    it('deve carregar modo escuro quando localStorage tem darkMode=true', () => {
      localStorage.setItem('darkMode', 'true');
      
      const { result } = renderHook(() => useDarkMode());
      
      expect(result.current.isDark).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('deve carregar modo claro quando localStorage tem darkMode=false', () => {
      localStorage.setItem('darkMode', 'false');
      
      const { result } = renderHook(() => useDarkMode());
      
      expect(result.current.isDark).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('toggleDarkMode', () => {
    it('deve alternar de claro para escuro', () => {
      const { result } = renderHook(() => useDarkMode());
      
      expect(result.current.isDark).toBe(false);
      
      act(() => {
        result.current.toggleDarkMode();
      });
      
      expect(result.current.isDark).toBe(true);
      expect(localStorage.getItem('darkMode')).toBe('true');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('deve alternar de escuro para claro', () => {
      localStorage.setItem('darkMode', 'true');
      const { result } = renderHook(() => useDarkMode());
      
      expect(result.current.isDark).toBe(true);
      
      act(() => {
        result.current.toggleDarkMode();
      });
      
      expect(result.current.isDark).toBe(false);
      expect(localStorage.getItem('darkMode')).toBe('false');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('deve atualizar classe dark no documento imediatamente', () => {
      const { result } = renderHook(() => useDarkMode());
      
      // Inicialmente sem classe dark
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      // Toggle para escuro
      act(() => {
        result.current.toggleDarkMode();
      });
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      
      // Toggle para claro
      act(() => {
        result.current.toggleDarkMode();
      });
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('múltiplos toggles', () => {
    it('deve alternar corretamente múltiplas vezes', () => {
      const { result } = renderHook(() => useDarkMode());
      
      // Começa claro
      expect(result.current.isDark).toBe(false);
      
      // Toggle 1: escuro
      act(() => result.current.toggleDarkMode());
      expect(result.current.isDark).toBe(true);
      
      // Toggle 2: claro
      act(() => result.current.toggleDarkMode());
      expect(result.current.isDark).toBe(false);
      
      // Toggle 3: escuro
      act(() => result.current.toggleDarkMode());
      expect(result.current.isDark).toBe(true);
    });
  });
});

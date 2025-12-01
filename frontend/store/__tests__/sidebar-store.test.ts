/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useSidebarStore } from '../sidebar-store';

describe('sidebar-store', () => {
  beforeEach(() => {
    // Reset store state
    useSidebarStore.setState({ isOpen: true });
  });

  describe('estado inicial', () => {
    it('deve iniciar com sidebar aberta', () => {
      const { result } = renderHook(() => useSidebarStore());

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('toggle', () => {
    it('deve alternar estado da sidebar', () => {
      const { result } = renderHook(() => useSidebarStore());

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('open', () => {
    it('deve abrir a sidebar', () => {
      const { result } = renderHook(() => useSidebarStore());

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('close', () => {
    it('deve fechar a sidebar', () => {
      const { result } = renderHook(() => useSidebarStore());

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });
});

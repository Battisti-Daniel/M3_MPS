/**
 * @jest-environment jsdom
 */
import { getStoredToken, storeToken, clearToken } from '../auth-storage';

describe('auth-storage', () => {
  beforeEach(() => {
    // Limpa o localStorage antes de cada teste
    localStorage.clear();
  });

  describe('getStoredToken', () => {
    it('deve retornar null quando não há token', () => {
      const result = getStoredToken();
      expect(result).toBeNull();
    });

    it('deve retornar o token armazenado', () => {
      localStorage.setItem('agenda_plus_token', 'test-token-123');
      const result = getStoredToken();
      expect(result).toBe('test-token-123');
    });
  });

  describe('storeToken', () => {
    it('deve armazenar o token no localStorage', () => {
      storeToken('my-new-token');
      expect(localStorage.getItem('agenda_plus_token')).toBe('my-new-token');
    });

    it('deve sobrescrever token existente', () => {
      storeToken('old-token');
      storeToken('new-token');
      expect(localStorage.getItem('agenda_plus_token')).toBe('new-token');
    });
  });

  describe('clearToken', () => {
    it('deve remover o token do localStorage', () => {
      localStorage.setItem('agenda_plus_token', 'token-to-remove');
      clearToken();
      expect(localStorage.getItem('agenda_plus_token')).toBeNull();
    });

    it('não deve lançar erro quando não há token', () => {
      expect(() => clearToken()).not.toThrow();
    });
  });

  describe('fluxo completo', () => {
    it('deve armazenar, recuperar e limpar token', () => {
      // Inicialmente vazio
      expect(getStoredToken()).toBeNull();

      // Armazena
      storeToken('flow-test-token');
      expect(getStoredToken()).toBe('flow-test-token');

      // Limpa
      clearToken();
      expect(getStoredToken()).toBeNull();
    });
  });
});

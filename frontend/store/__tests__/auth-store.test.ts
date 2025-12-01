/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '../auth-store';
import api from '@/lib/api';
import { getStoredToken, storeToken, clearToken } from '@/lib/auth-storage';

jest.mock('@/lib/api');
jest.mock('@/lib/auth-storage');

const mockedApi = api as jest.Mocked<typeof api>;
const mockedGetStoredToken = getStoredToken as jest.MockedFunction<typeof getStoredToken>;
const mockedStoreToken = storeToken as jest.MockedFunction<typeof storeToken>;
const mockedClearToken = clearToken as jest.MockedFunction<typeof clearToken>;

describe('auth-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      initializing: true,
    });
  });

  describe('estado inicial', () => {
    it('deve iniciar com user e token nulos', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.initializing).toBe(true);
    });
  });

  describe('setAuth', () => {
    it('deve definir token e usuário', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          token: 'test-token',
          user: { id: 1, name: 'Test User', email: 'test@test.com' } as any,
        });
      });

      expect(result.current.token).toBe('test-token');
      expect(result.current.user?.name).toBe('Test User');
      expect(mockedStoreToken).toHaveBeenCalledWith('test-token');
    });
  });

  describe('setUser', () => {
    it('deve atualizar apenas o usuário', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          token: 'original-token',
          user: { id: 1, name: 'Original' } as any,
        });
      });

      act(() => {
        result.current.setUser({ id: 1, name: 'Updated User' } as any);
      });

      expect(result.current.user?.name).toBe('Updated User');
      expect(result.current.token).toBe('original-token');
    });
  });

  describe('logout', () => {
    it('deve limpar token e usuário', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          token: 'test-token',
          user: { id: 1, name: 'Test' } as any,
        });
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(mockedClearToken).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('deve definir initializing como false quando não há token', async () => {
      mockedGetStoredToken.mockReturnValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.initializing).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('deve carregar usuário quando há token válido', async () => {
      mockedGetStoredToken.mockReturnValue('valid-token');
      mockedApi.get.mockResolvedValue({
        data: { id: 1, name: 'Loaded User', email: 'loaded@test.com' },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      await waitFor(() => {
        expect(result.current.initializing).toBe(false);
      });
      expect(result.current.user?.name).toBe('Loaded User');
      expect(result.current.token).toBe('valid-token');
    });

    it('deve limpar token quando API falha', async () => {
      mockedGetStoredToken.mockReturnValue('invalid-token');
      mockedApi.get.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      await waitFor(() => {
        expect(result.current.initializing).toBe(false);
      });
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(mockedClearToken).toHaveBeenCalled();
    });
  });
});

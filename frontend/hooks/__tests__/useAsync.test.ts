import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync } from '../useAsync';

describe('useAsync', () => {
  describe('estado inicial', () => {
    it('deve iniciar com estado padrão', () => {
      const asyncFn = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve iniciar com loading true quando immediate é true', () => {
      const asyncFn = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn, true));

      expect(result.current.loading).toBe(true);
    });
  });

  describe('execute', () => {
    it('deve executar função assíncrona com sucesso', async () => {
      const mockData = { id: 1, name: 'Test' };
      const asyncFn = jest.fn().mockResolvedValue(mockData);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve passar argumentos para a função assíncrona', async () => {
      const asyncFn = jest.fn().mockResolvedValue('result');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute('arg1', 'arg2');
      });

      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('deve retornar dados da função', async () => {
      const mockData = 'returned data';
      const asyncFn = jest.fn().mockResolvedValue(mockData);
      const { result } = renderHook(() => useAsync(asyncFn));

      let returnedData: string | undefined;
      await act(async () => {
        returnedData = await result.current.execute();
      });

      expect(returnedData).toBe(mockData);
    });

    it('deve setar loading durante execução', async () => {
      let resolvePromise: (value: string) => void;
      const asyncFn = jest.fn().mockImplementation(
        () => new Promise<string>((resolve) => {
          resolvePromise = resolve;
        })
      );
      const { result } = renderHook(() => useAsync(asyncFn));

      // Inicia a execução sem esperar
      act(() => {
        result.current.execute();
      });

      // Deve estar loading
      expect(result.current.loading).toBe(true);

      // Resolve a promise
      await act(async () => {
        resolvePromise!('done');
      });

      // Não deve mais estar loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('deve capturar erro quando função falha', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Erro esperado
        }
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('deve converter erro não-Error para Error', async () => {
      const asyncFn = jest.fn().mockRejectedValue('string error');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Erro esperado
        }
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });

    it('deve propagar erro', async () => {
      const error = new Error('Propagated error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));

      await expect(async () => {
        await act(async () => {
          await result.current.execute();
        });
      }).rejects.toThrow('Propagated error');
    });
  });

  describe('reset', () => {
    it('deve resetar para estado inicial', async () => {
      const mockData = { id: 1 };
      const asyncFn = jest.fn().mockResolvedValue(mockData);
      const { result } = renderHook(() => useAsync(asyncFn));

      // Executa para preencher dados
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(mockData);

      // Reseta
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve resetar após erro', async () => {
      const error = new Error('Test error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Esperado
        }
      });

      expect(result.current.error).toEqual(error);

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('múltiplas execuções', () => {
    it('deve atualizar dados em execuções subsequentes', async () => {
      let callCount = 0;
      const asyncFn = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ count: callCount });
      });
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual({ count: 1 });

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual({ count: 2 });
    });
  });
});

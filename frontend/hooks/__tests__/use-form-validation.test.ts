import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useFormValidation } from '../use-form-validation';

// Wrapper para criar um formulário de teste
function useTestForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    },
    mode: 'onChange',
  });
  return form;
}

describe('useFormValidation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('estado inicial', () => {
    it('deve iniciar sem validação', () => {
      const { result } = renderHook(() => {
        const form = useTestForm();
        const validation = useFormValidation(form, 'name');
        return { form, validation };
      });

      expect(result.current.validation.isValidating).toBe(false);
      expect(result.current.validation.isValid).toBeNull();
      expect(result.current.validation.hasError).toBe(false);
      expect(result.current.validation.isDirty).toBe(false);
    });
  });

  describe('ao alterar campo', () => {
    it('deve atualizar isDirty quando campo é modificado', async () => {
      const { result } = renderHook(() => {
        const form = useTestForm();
        const validation = useFormValidation(form, 'name');
        return { form, validation };
      });

      act(() => {
        result.current.form.setValue('name', 'Test', { 
          shouldDirty: true,
          shouldTouch: true,
        });
      });

      expect(result.current.validation.isDirty).toBe(true);
    });

    it('deve iniciar validação quando campo tem valor', async () => {
      const { result } = renderHook(() => {
        const form = useTestForm();
        const validation = useFormValidation(form, 'name');
        return { form, validation };
      });

      act(() => {
        result.current.form.setValue('name', 'Test Value', { 
          shouldDirty: true,
        });
      });

      expect(result.current.validation.isValidating).toBe(true);

      // Avança o timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.validation.isValidating).toBe(false);
      });
    });

    it('deve marcar como válido após timer sem erros', async () => {
      const { result } = renderHook(() => {
        const form = useTestForm();
        const validation = useFormValidation(form, 'name');
        return { form, validation };
      });

      act(() => {
        result.current.form.setValue('name', 'Valid Name', { 
          shouldDirty: true,
        });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.validation.isValid).toBe(true);
      });
    });
  });

  describe('com erro de validação', () => {
    it('deve indicar hasError quando há erro', async () => {
      const { result } = renderHook(() => {
        const form = useForm({
          defaultValues: { email: '' },
          mode: 'onChange',
        });
        const validation = useFormValidation(form, 'email');
        return { form, validation };
      });

      // Simula erro de validação
      act(() => {
        result.current.form.setError('email', {
          type: 'manual',
          message: 'Email inválido',
        });
      });

      expect(result.current.validation.hasError).toBe(true);
    });
  });

  describe('limpeza de timer', () => {
    it('deve limpar timer em desmontagem', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { result, unmount } = renderHook(() => {
        const form = useTestForm();
        const validation = useFormValidation(form, 'name');
        return { form, validation };
      });

      act(() => {
        result.current.form.setValue('name', 'Test', { 
          shouldDirty: true,
        });
      });

      unmount();

      // Deve ter chamado clearTimeout
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});

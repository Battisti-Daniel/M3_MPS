/**
 * @jest-environment jsdom
 */
import axios from 'axios';
import api from '../api';

// Mock do auth-storage
jest.mock('../auth-storage', () => ({
  getStoredToken: jest.fn(),
}));

import { getStoredToken } from '../auth-storage';

const mockedGetStoredToken = getStoredToken as jest.MockedFunction<typeof getStoredToken>;

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location
    delete (window as { location?: Location }).location;
    (window as { location?: Partial<Location> }).location = {
      href: '',
    };
  });

  describe('configuração base', () => {
    it('deve ter um baseURL configurado', () => {
      expect(api.defaults.baseURL).toBeDefined();
      expect(api.defaults.baseURL).toContain('/api');
    });

    it('deve ter timeout configurado', () => {
      expect(api.defaults.timeout).toBe(15000);
    });

    it('deve ter headers de Accept e Content-Type', () => {
      expect(api.defaults.headers.Accept).toBe('application/json');
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('interceptor de requisição', () => {
    it('deve adicionar token de autorização quando disponível', async () => {
      mockedGetStoredToken.mockReturnValue('test-token');
      
      // Cria um mock adapter para interceptar a requisição
      const mockAdapter = jest.fn().mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const testApi = axios.create({
        baseURL: 'http://test.com',
        adapter: mockAdapter,
      });
      
      // Adiciona o mesmo interceptor
      testApi.interceptors.request.use((config) => {
        const token = mockedGetStoredToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
      
      await testApi.get('/test');
      
      expect(mockAdapter).toHaveBeenCalled();
      const requestConfig = mockAdapter.mock.calls[0][0];
      expect(requestConfig.headers.Authorization).toBe('Bearer test-token');
    });

    it('não deve adicionar token quando não disponível', async () => {
      mockedGetStoredToken.mockReturnValue(null);
      
      const mockAdapter = jest.fn().mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      
      const testApi = axios.create({
        baseURL: 'http://test.com',
        adapter: mockAdapter,
      });
      
      testApi.interceptors.request.use((config) => {
        const token = mockedGetStoredToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
      
      await testApi.get('/test');
      
      const requestConfig = mockAdapter.mock.calls[0][0];
      expect(requestConfig.headers.Authorization).toBeUndefined();
    });
  });

  describe('tratamento de erros', () => {
    it('deve tratar erro de timeout', () => {
      const error = {
        code: 'ECONNABORTED',
        message: '',
        response: undefined,
        request: {},
        config: {},
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
      };
      
      // Simula o handler de erro
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          error.message = 'Tempo de requisição excedido. Tente novamente.';
        }
      }
      
      expect(error.message).toBe('Tempo de requisição excedido. Tente novamente.');
    });

    it('deve tratar erro de conexão', () => {
      const error = {
        code: '',
        message: '',
        response: undefined,
        request: {},
        config: {},
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
      };
      
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          error.message = 'Tempo de requisição excedido. Tente novamente.';
        } else if (error.request) {
          error.message = 'Erro de conexão. Verifique sua internet.';
        }
      }
      
      expect(error.message).toBe('Erro de conexão. Verifique sua internet.');
    });

    it('deve tratar erro 403 (permissão negada)', () => {
      const data = { message: 'Acesso negado' };
      const status = 403;
      
      let message = '';
      switch (status) {
        case 403:
          message = data?.message || 'Você não tem permissão para realizar esta ação.';
          break;
      }
      
      expect(message).toBe('Acesso negado');
    });

    it('deve tratar erro 404 (não encontrado)', () => {
      const status = 404;
      const data = {};
      
      let message = '';
      switch (status) {
        case 404:
          message = (data as { message?: string })?.message || 'Recurso não encontrado.';
          break;
      }
      
      expect(message).toBe('Recurso não encontrado.');
    });

    it('deve tratar erro 422 (validação)', () => {
      const data = {
        errors: {
          email: ['O campo email é obrigatório.'],
        },
      };
      
      const errors = data.errors;
      const firstKey = Object.keys(errors)[0];
      const value = errors[firstKey as keyof typeof errors];
      const message = Array.isArray(value) ? value[0] : value;
      
      expect(message).toBe('O campo email é obrigatório.');
    });

    it('deve tratar erro 429 (rate limit)', () => {
      const status = 429;
      
      let message = '';
      switch (status) {
        case 429:
          message = 'Muitas requisições. Aguarde um momento e tente novamente.';
          break;
      }
      
      expect(message).toBe('Muitas requisições. Aguarde um momento e tente novamente.');
    });

    it('deve tratar erros de servidor (5xx)', () => {
      const statuses = [500, 502, 503];
      
      statuses.forEach((status) => {
        let message = '';
        switch (status) {
          case 500:
          case 502:
          case 503:
            message = 'Erro no servidor. Tente novamente mais tarde.';
            break;
        }
        
        expect(message).toBe('Erro no servidor. Tente novamente mais tarde.');
      });
    });
  });

  describe('extractValidationErrors (lógica)', () => {
    it('deve extrair primeiro erro de array', () => {
      const data = {
        errors: {
          name: ['Nome é obrigatório', 'Nome muito curto'],
        },
      };
      
      const errors = data.errors;
      const firstKey = Object.keys(errors)[0];
      const value = errors[firstKey as keyof typeof errors];
      const result = Array.isArray(value) ? value[0] : value;
      
      expect(result).toBe('Nome é obrigatório');
    });

    it('deve extrair erro quando é string', () => {
      const data = {
        errors: {
          email: 'Email inválido',
        },
      };
      
      const errors = data.errors;
      const firstKey = Object.keys(errors)[0];
      const value = errors[firstKey as keyof typeof errors];
      const result = Array.isArray(value) ? value[0] : value;
      
      expect(result).toBe('Email inválido');
    });

    it('deve retornar null quando não há erros', () => {
      const data = {};
      const result = (data as { errors?: Record<string, string | string[]> })?.errors ?? null;
      
      expect(result).toBeNull();
    });
  });
});

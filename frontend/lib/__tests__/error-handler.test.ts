import { errorHandler } from '../error-handler';

describe('ErrorHandler', () => {
  describe('getErrorMessage', () => {
    it('should return default message for unknown error', () => {
      const error = {};
      const message = errorHandler.getErrorMessage(error);
      expect(message).toBe('Ocorreu um erro inesperado.');
    });

    it('should return server message when available', () => {
      const error = {
        response: {
          data: {
            message: 'Erro do servidor',
          },
        },
      };
      const message = errorHandler.getErrorMessage(error);
      expect(message).toBe('Erro do servidor');
    });

    it('should extract validation error message', () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['O email é obrigatório'],
            },
          },
        },
      };
      const message = errorHandler.getErrorMessage(error);
      expect(message).toBe('O email é obrigatório');
    });

    it('should return error message when available', () => {
      const error = {
        message: 'Erro de conexão',
      };
      const message = errorHandler.getErrorMessage(error);
      expect(message).toBe('Erro de conexão');
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      const error = {
        message: 'Network Error',
      };
      expect(errorHandler.isNetworkError(error)).toBe(true);
    });

    it('should return false for API errors', () => {
      const error = {
        response: {
          status: 500,
        },
      };
      expect(errorHandler.isNetworkError(error)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for 422 status', () => {
      const error = {
        response: {
          status: 422,
        },
      };
      expect(errorHandler.isValidationError(error)).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = {
        response: {
          status: 500,
        },
      };
      expect(errorHandler.isValidationError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for 401 status', () => {
      const error = {
        response: {
          status: 401,
        },
      };
      expect(errorHandler.isAuthError(error)).toBe(true);
    });

    it('should return true for 403 status', () => {
      const error = {
        response: {
          status: 403,
        },
      };
      expect(errorHandler.isAuthError(error)).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = {
        response: {
          status: 500,
        },
      };
      expect(errorHandler.isAuthError(error)).toBe(false);
    });
  });

  describe('getValidationErrors', () => {
    it('should extract all validation errors', () => {
      const error = {
        response: {
          data: {
            errors: {
              email: ['O email é obrigatório'],
              password: ['A senha é obrigatória'],
            },
          },
        },
      };
      const errors = errorHandler.getValidationErrors(error);
      expect(errors).toEqual({
        email: 'O email é obrigatório',
        password: 'A senha é obrigatória',
      });
    });

    it('should return empty object when no errors', () => {
      const error = {};
      const errors = errorHandler.getValidationErrors(error);
      expect(errors).toEqual({});
    });
  });
});


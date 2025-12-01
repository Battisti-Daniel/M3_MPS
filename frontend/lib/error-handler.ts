/**
 * Sistema centralizado de tratamento de erros
 * 
 * Fornece funções utilitárias para tratamento consistente de erros
 * em toda a aplicação
 */

export type ApiError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[] | string>;
    };
  };
  message?: string;
  code?: string;
};

export interface ErrorHandler {
  handle(error: unknown, context?: string): void;
  getErrorMessage(error: unknown): string;
  isNetworkError(error: unknown): boolean;
  isValidationError(error: unknown): boolean;
  isAuthError(error: unknown): boolean;
}

/**
 * Classe para tratamento centralizado de erros
 */
export class AppErrorHandler implements ErrorHandler {
  private defaultMessage = "Ocorreu um erro inesperado.";

  /**
   * Trata um erro e executa ações apropriadas
   */
  handle(error: unknown, context?: string): void {
    const apiError = error as ApiError;
    const message = this.getErrorMessage(error);

    // Log do erro para monitoramento
    if (process.env.NODE_ENV === 'development') {
      const errorDetails: Record<string, unknown> = {
        message,
      };

      // Adiciona informações adicionais apenas se estiverem disponíveis
      if (apiError?.response?.status) {
        errorDetails.status = apiError.response.status;
      }

      if (apiError?.response?.data) {
        errorDetails.responseData = apiError.response.data;
      }

      if (apiError?.message && apiError.message !== message) {
        errorDetails.originalMessage = apiError.message;
      }

      if (apiError?.code) {
        errorDetails.code = apiError.code;
      }

      // Se houver um erro real com propriedades, inclui o objeto de erro
      if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        errorDetails.error = error;
      }

      console.error(`[Error Handler] ${context || 'Erro'}:`, errorDetails);
    }

    // Em produção, enviar para serviço de monitoramento (Sentry, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { tags: { context } });
    // }
  }

  /**
   * Extrai mensagem de erro amigável
   */
  getErrorMessage(error: unknown): string {
    const apiError = error as ApiError;

    // Erro de validação
    if (this.isValidationError(error)) {
      return this.extractValidationMessage(apiError);
    }

    // Mensagem do servidor
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }

    // Mensagem do erro
    if (apiError.message) {
      return apiError.message;
    }

    return this.defaultMessage;
  }

  /**
   * Verifica se é erro de rede
   */
  isNetworkError(error: unknown): boolean {
    const apiError = error as ApiError;
    return !apiError.response && !!apiError.message;
  }

  /**
   * Verifica se é erro de validação (422)
   */
  isValidationError(error: unknown): boolean {
    const apiError = error as ApiError;
    return apiError.response?.status === 422;
  }

  /**
   * Verifica se é erro de autenticação (401/403)
   */
  isAuthError(error: unknown): boolean {
    const apiError = error as ApiError;
    const status = apiError.response?.status;
    return status === 401 || status === 403;
  }

  /**
   * Extrai primeira mensagem de validação
   */
  private extractValidationMessage(error: ApiError): string {
    const errors = error.response?.data?.errors;
    if (!errors) return "Dados inválidos.";

    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return "Dados inválidos.";

    const value = errors[firstKey];
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * Extrai todas as mensagens de validação
   */
  getValidationErrors(error: unknown): Record<string, string> {
    const apiError = error as ApiError;
    const errors = apiError.response?.data?.errors;
    if (!errors) return {};

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(errors)) {
      result[key] = Array.isArray(value) ? value[0] : value;
    }
    return result;
  }
}

// Instância singleton
export const errorHandler = new AppErrorHandler();

/**
 * Hook helper para uso em componentes
 */
export function useErrorHandler() {
  return {
    handle: (error: unknown, context?: string) => errorHandler.handle(error, context),
    getMessage: (error: unknown) => errorHandler.getErrorMessage(error),
    isNetwork: (error: unknown) => errorHandler.isNetworkError(error),
    isValidation: (error: unknown) => errorHandler.isValidationError(error),
    isAuth: (error: unknown) => errorHandler.isAuthError(error),
    getValidationErrors: (error: unknown) => errorHandler.getValidationErrors(error),
  };
}


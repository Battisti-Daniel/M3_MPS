import toast from "react-hot-toast";
import { errorHandler } from "./error-handler";

/**
 * Trata erros da API e exibe notificação toast
 * 
 * @param error - Erro a ser tratado
 * @param fallback - Mensagem padrão caso não seja possível extrair mensagem
 */
export function handleApiError(error: unknown, fallback = "Ocorreu um erro inesperado.") {
  // Usa o sistema centralizado de tratamento de erros
  errorHandler.handle(error, "API Error");
  
  const message = errorHandler.getErrorMessage(error) || fallback;
  
  // Se for erro de autenticação, não mostra toast (já redireciona)
  if (errorHandler.isAuthError(error)) {
    return;
  }
  
  toast.error(message);
}

/**
 * Extrai primeira mensagem de erro de validação
 * @deprecated Use errorHandler.getValidationErrors() ou errorHandler.getErrorMessage()
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _extractFirstError(errors?: Record<string, string[] | string>) {
  if (!errors) return null;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;
  const value = errors[firstKey];
  return Array.isArray(value) ? value[0] : value;
}



import axios from 'axios';
import { ApiErrorPayload } from '../types/models';

export function extractApiError(error: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data;
    if (data?.details) {
      if (typeof data.details === 'string') {
        return data.details;
      }
      if (Array.isArray(data.details)) {
        const first = data.details[0] as { message?: string } | string | undefined;
        if (typeof first === 'string') return first;
        if (first?.message) return first.message;
      } else if (typeof data.details === 'object') {
        const messages = Object.values(data.details)
          .flat()
          .filter((msg): msg is string => typeof msg === 'string' && msg.length > 0);
        if (messages.length > 0) {
          return messages.join(' | ');
        }
      }
    }
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (error.message === 'Network Error') {
      return 'Erro de rede: não foi possível ligar ao servidor. Verifica o endereço da API e a ligação Wi-Fi.';
    }
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8070';

const resolveEnvBaseUrl = () => {
  const envUrl = import.meta?.env?.VITE_BACKEND_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim();
  }
  return undefined;
};

const resolveGlobalBaseUrl = () => {
  if (typeof window !== 'undefined' && typeof window.__APP_BACKEND_URL__ === 'string') {
    const value = window.__APP_BACKEND_URL__.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
};

export const API_BASE_URL =
  resolveGlobalBaseUrl() ||
  resolveEnvBaseUrl() ||
  DEFAULT_BACKEND_URL;

export const getApiBaseUrl = () => API_BASE_URL;

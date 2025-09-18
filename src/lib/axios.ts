// src/lib/axios.ts
import axios from 'axios';

let accessToken: string | null = null;
let logoutCallback: (() => void) | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];
let lastRefreshSuccessAt = 0; // loop breaker

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function setLogoutCallback(callback: (() => void) | null) {
  logoutCallback = callback;
}

const isTokenExpiredOrExpiringSoon = (token: string, bufferMinutes = 5): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000;
    return currentTime >= (expiryTime - bufferTime);
  } catch {
    return true;
  }
};

const refreshAccessToken = async (): Promise<string> => {
  const res = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
  const newAccessToken = res.data.accessToken;
  setAccessToken(newAccessToken);
  localStorage.setItem('accessToken', newAccessToken);
  lastRefreshSuccessAt = Date.now();
  return newAccessToken;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
};

const api = axios.create();

api.interceptors.request.use(async (config) => {
  const authEndpoints = ['/api/auth/login', '/api/auth/verify-otp', '/api/auth/refresh-token', '/api/auth/logout'];
  const isAuthEndpoint = authEndpoints.some((endpoint) => config.url?.includes(endpoint));
  if (isAuthEndpoint) return config;

  let currentToken = accessToken || localStorage.getItem('accessToken');

  if (currentToken && isTokenExpiredOrExpiringSoon(currentToken)) {
    if (isRefreshing) {
      const newToken = await new Promise((resolve, reject) => failedQueue.push({ resolve, reject }));
      currentToken = newToken as string;
    } else {
      isRefreshing = true;
      try {
        currentToken = await refreshAccessToken();
        processQueue(null, currentToken);
      } catch (error) {
        processQueue(error, null);
        // hard logout
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (logoutCallback) logoutCallback(); else window.location.href = '/login';
        throw error;
      } finally {
        isRefreshing = false;
      }
    }
  }

  if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const code = error?.response?.data?.code;

    const authEndpoints = ['/api/auth/login', '/api/auth/verify-otp', '/api/auth/refresh-token', '/api/auth/logout'];
    const isAuthEndpoint = authEndpoints.some((endpoint) => originalRequest?.url?.includes(endpoint));
    if (isAuthEndpoint) return Promise.reject(error);

    // 🚨 Non-recoverable: do NOT refresh; force logout
    const hardLogoutCodes = new Set([
      'ACCOUNT_DEACTIVATED',
      'ACCOUNT_DELETED',
      'PERMISSION_DENIED',
      'ADMIN_REQUIRED',
    ]);
    if (code === 'TOKEN_VERSION_MISMATCH' && !originalRequest._retry) {
  originalRequest._retry = true;
  try {
    const newAccessToken = await refreshAccessToken();
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  } catch (e) {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    if (logoutCallback) logoutCallback(); else window.location.href = '/login';
    return Promise.reject(e);
  }
}
    if (hardLogoutCodes.has(code)) {
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (logoutCallback) logoutCallback(); else window.location.href = '/login?reason=' + code;
      return Promise.reject(error);
    }

    // Loop breaker: if we refreshed very recently and still got 401/403, hard logout
    if ((status === 401 || status === 403) && Date.now() - lastRefreshSuccessAt < 8000) {
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (logoutCallback) logoutCallback(); else window.location.href = '/login';
      return Promise.reject(error);
    }

    // Try a single refresh for generic 401/403
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        try {
          const newToken = await new Promise((resolve, reject) => failedQueue.push({ resolve, reject }));
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      isRefreshing = true;
      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (logoutCallback) logoutCallback(); else window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export const authApi = axios.create();

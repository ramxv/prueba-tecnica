
// src/lib/http.ts (o donde tengas este archivo)
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "http://localhost:9000";

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export type ApiError = {
  status?: number;
  code?: string | number;
  message?: string;
  details?: unknown;
  url?: string;
  method?: string;
};

function normalizeAxiosError(error: unknown): ApiError {
  const err = error as AxiosError<any>;
  const status = err.response?.status;
  const data = err.response?.data;

  const message =
    (data && (data.message || data.error || data.detail)) ||
    err.message ||
    "Error de red";

  return {
    status,
    code: (data && (data.code || data.errorCode)) ?? err.code,
    message,
    details: data,
    url: err.config?.url,
    method: err.config?.method?.toUpperCase(),
  };
}

/** ======= Interceptor de request ======= */
const reqId = http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (crypto?.randomUUID) {
      (config.headers as any)["X-Request-Id"] = crypto.randomUUID();
    }
    return config;
  },
  (error) => Promise.reject(normalizeAxiosError(error))
);

/** ======= Interceptor de response ======= */
const resId = http.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(normalizeAxiosError(error))
);

/** ======= Limpieza en Vite/HMR (evita duplicados) ======= */
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    http.interceptors.request.eject(reqId);
    http.interceptors.response.eject(resId);
  });
}


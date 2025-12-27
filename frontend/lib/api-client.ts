import { apiBaseUrl } from "./env";
import type { AuthTokens } from "./auth/types";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  tokens?: AuthTokens;
  skipAuth?: boolean;
  refresh?: () => Promise<AuthTokens | undefined>;
}

export interface ApiErrorPayload {
  message: string;
  status: number;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.details = payload.details;
  }
}

const buildUrl = (path: string) => {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalized}`;
};

const asJson = (value: unknown) =>
  value instanceof FormData ? value : JSON.stringify(value ?? {});

const createHeaders = (options: RequestOptions) => {
  const base: Record<string, string> = {
    Accept: "application/json",
  };

  if (!(options.body instanceof FormData)) {
    base["Content-Type"] = "application/json";
  }

  if (!options.skipAuth && options.tokens?.accessToken) {
    base.Authorization = `Bearer ${options.tokens.accessToken}`;
  }

  return {
    ...base,
    ...(options.headers || {}),
  } satisfies HeadersInit;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => ({})) : undefined;

  if (!response.ok) {
    // Handle error responses - backend wraps in { success: false, error: {...} }
    const error = (payload as { error?: { message?: string; details?: unknown } })?.error;
    const message = error?.message || (payload as { message?: string })?.message || "Request failed";
    throw new ApiError({
      message,
      status: response.status,
      details: error?.details || payload,
    });
  }

  // Backend wraps successful responses in { success: true, data: {...} }
  const wrappedPayload = payload as { success?: boolean; data?: T };
  if (wrappedPayload?.success && wrappedPayload.data !== undefined) {
    return wrappedPayload.data;
  }

  return (payload as T) ?? ({} as T);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path);
  const headers = createHeaders(options);

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? asJson(options.body) : undefined,
    credentials: "include",
  });

  if (response.status === 401 && options.refresh && !options.skipAuth) {
    const nextTokens = await options.refresh();
    if (nextTokens?.accessToken) {
      return request<T>(path, { ...options, tokens: nextTokens, refresh: undefined });
    }
  }

  return parseResponse<T>(response);
}

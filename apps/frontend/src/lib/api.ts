const BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000') + '/api';

/** Erro de API com status HTTP e mensagem já legível. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

/** Wrapper de fetch contra a API do backend (prefixo /api). */
export async function apiFetch<T>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const res = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message = extractMessage(data) ?? `Erro ${res.status}`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

function extractMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return null;
}

export type ApiClientOptions = {
  baseUrl?: string;
  getToken?: () => Promise<string | null | undefined>;
  fetchImpl?: typeof fetch;
};

function joinUrl(base: string, path: string) {
  if (path.startsWith("http")) return path;
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const fetchFn = options.fetchImpl ?? fetch;

  async function request<T>(
    path: string,
    init: RequestInit & { parseJson?: boolean } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
      headers.set("Content-Type", "application/json");
    }
    const token = options.getToken ? await options.getToken() : undefined;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetchFn(joinUrl(baseUrl, path), {
      ...init,
      headers,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    if (init.parseJson === false) {
      return undefined as T;
    }
    const ct = res.headers.get("content-type");
    if (ct?.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as T;
  }

  return {
    get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    put: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: "PUT",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    delete: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: "DELETE" }),
  };
}

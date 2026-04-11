import { useAuthStore } from "@/stores/authStore";

const baseUrl = import.meta.env.VITE_BASE_URL;

let refreshInFlight: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const result = await useAuthStore.getState().refresh();
      return result.success;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function buildHeaders(token: string | null, init: RequestInit): Headers {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

export interface ApiFetchOptions extends RequestInit {
  /** Skip the 401 → refresh → retry dance (used by auth endpoints themselves). */
  skipAuth?: boolean;
}

/**
 * Authenticated fetch wrapper.
 *
 * - Attaches `Authorization: Bearer <token>` from authStore.
 * - Sets `credentials: "include"` so the refresh-token cookie flows.
 * - On 401, calls authStore.refresh() once (concurrent calls coalesce),
 *   then retries the original request with the new access token.
 * - If refresh fails, clears auth state and hard-redirects to /login.
 */
export async function apiFetch(
  path: string,
  init: ApiFetchOptions = {},
): Promise<Response> {
  const { skipAuth, ...rest } = init;
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const doFetch = (token: string | null) =>
    fetch(url, {
      ...rest,
      headers: buildHeaders(token, rest),
      credentials: "include",
    });

  const response = await doFetch(useAuthStore.getState().token);
  if (response.status !== 401 || skipAuth) return response;

  const refreshed = await refreshOnce();
  if (!refreshed) {
    useAuthStore.getState().clearToken();
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
    return response;
  }

  return doFetch(useAuthStore.getState().token);
}

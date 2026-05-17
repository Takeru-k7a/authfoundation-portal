import type {
  AuthApiResult,
  LoginResponse,
  SignupResponse,
  TermsResponse,
  TermsSubmitResponse
} from "~/types/auth";
import { sha256HexUpper } from "~/utils/sha256";

type FormValue = string | number | boolean;

function parseResponse<T>(text: string): T {
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { raw: text } as T;
  }
}

export function useAuthApi() {
  const config = useRuntimeConfig();
  const authApiBase = computed(() => String(config.public.authApiBase || "").replace(/\/$/, ""));

  const resolveApiPath = (path: string) => {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${authApiBase.value}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const normalizeRedirect = (location: string | null) => {
    if (!location) {
      return null;
    }

    if (/^https?:\/\//i.test(location)) {
      return location;
    }

    return resolveApiPath(location);
  };

  const postForm = async <T>(
    path: string,
    sessionId: string,
    values: Record<string, FormValue | FormValue[]>
  ): Promise<AuthApiResult<T>> => {
    const body = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => body.append(key, String(item)));
        return;
      }

      body.set(key, String(value));
    });

    const response = await fetch(resolveApiPath(path), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(sessionId ? { "x-session-id": sessionId } : {})
      },
      body: body.toString()
    });

    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      data: parseResponse<T>(text),
      location: normalizeRedirect(response.headers.get("Location"))
    };
  };

  const getJson = async <T>(path: string, sessionId: string): Promise<AuthApiResult<T>> => {
    const response = await fetch(resolveApiPath(path), {
      credentials: "include",
      headers: {
        ...(sessionId ? { "x-session-id": sessionId } : {})
      }
    });

    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      data: parseResponse<T>(text),
      location: normalizeRedirect(response.headers.get("Location"))
    };
  };

  const login = async (input: { sessionId: string; email: string; password: string }) => {
    const passwordHash = await sha256HexUpper(input.password);
    return await postForm<LoginResponse>("/login", input.sessionId, {
      email: input.email,
      password: passwordHash
    });
  };

  const signup = async (input: { sessionId: string; email: string; password: string }) => {
    const passwordHash = await sha256HexUpper(input.password);
    return await postForm<SignupResponse>("/Signup/Account", input.sessionId, {
      email: input.email,
      password: passwordHash
    });
  };

  const fetchTerms = async (sessionId: string) => {
    return await getJson<TermsResponse>("/terms", sessionId);
  };

  const submitTerms = async (input: { sessionId: string; accepted: boolean; termIds: number[] }) => {
    return await postForm<TermsSubmitResponse>("/terms", input.sessionId, {
      accepted: input.accepted,
      term_ids: input.termIds
    });
  };

  return {
    authApiBase,
    resolveApiPath,
    normalizeRedirect,
    login,
    signup,
    fetchTerms,
    submitTerms
  };
}

import type {
  AuthorizeStartResponse,
  AuthApiResult,
  LoginResponse,
  SignupResponse,
  TermsResponse,
  TermsSubmitResponse,
  TokenResponse,
  UserInfoResponse
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
    values: Record<string, FormValue | FormValue[]>,
    extraHeaders: Record<string, string> = {}
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
        ...extraHeaders
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

  const login = async (input: { sessionId: string; email: string; password: string }) => {
    const passwordHash = await sha256HexUpper(input.password);
    return await postForm<LoginResponse>("/login", {
      session_id: input.sessionId,
      email: input.email,
      password: passwordHash
    });
  };

  const signup = async (input: { sessionId: string; email: string; password: string }) => {
    const passwordHash = await sha256HexUpper(input.password);
    return await postForm<SignupResponse>("/Signup/Account", {
      session_id: input.sessionId,
      email: input.email,
      password: passwordHash
    });
  };

  const fetchTerms = async (sessionId: string) => {
    return await postForm<TermsResponse>("/terms/list", {
      session_id: sessionId
    });
  };

  const submitTerms = async (input: { sessionId: string; accepted: boolean; termIds: string[] }) => {
    return await postForm<TermsSubmitResponse>("/terms", {
      session_id: input.sessionId,
      accepted: input.accepted,
      term_ids: input.termIds
    });
  };

  const exchangeCode = async (input: {
    clientId: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) => {
    return await postForm<TokenResponse>("/token", {
      grant_type: "authorization_code",
      client_id: input.clientId,
      code: input.code,
      code_verifier: input.codeVerifier,
      redirect_uri: input.redirectUri
    }, {
      "x-flow-type": "AuthorizationCode"
    });
  };

  const fetchUserInfo = async (accessToken: string): Promise<AuthApiResult<UserInfoResponse>> => {
    const response = await fetch(resolveApiPath("/userinfo"), {
      method: "GET",
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      data: parseResponse<UserInfoResponse>(text),
      location: normalizeRedirect(response.headers.get("Location"))
    };
  };

  const startAuthorize = async (authorizeUrl: URL): Promise<AuthApiResult<AuthorizeStartResponse>> => {
    const response = await fetch(authorizeUrl.toString(), {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "x-auth-ui-session-mode": "body"
      }
    });

    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      data: parseResponse<AuthorizeStartResponse>(text),
      location: normalizeRedirect(response.headers.get("Location"))
    };
  };

  return {
    authApiBase,
    resolveApiPath,
    normalizeRedirect,
    startAuthorize,
    login,
    signup,
    fetchTerms,
    submitTerms,
    exchangeCode,
    fetchUserInfo
  };
}

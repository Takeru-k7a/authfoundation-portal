import type {
  AuthorizeStartResponse,
  AuthApiResult,
  LoginResponse,
  LogoutResponse,
  SignupAccountResponse,
  SignupEmailResponse,
  SignupVerifyResponse,
  TermsResponse,
  TermsSubmitResponse,
  TokenResponse,
  UserInfoResponse
} from "~/types/auth";

type FormValue = string | number | boolean | undefined | null;

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

    try {
      const base = import.meta.client ? window.location.origin : "http://localhost";
      const redirectUrl = new URL(location, base);
      redirectUrl.searchParams.delete("session_id");
      return redirectUrl.toString();
    } catch {
      return location;
    }
  };

  const readResponse = async <T>(response: Response): Promise<AuthApiResult<T>> => {
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      data: parseResponse<T>(text),
      location: normalizeRedirect(response.headers.get("Location"))
    };
  };

  const postForm = async <T>(
    path: string,
    values: Record<string, FormValue | FormValue[]>,
    extraHeaders: Record<string, string> = {}
  ): Promise<AuthApiResult<T>> => {
    const body = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            body.append(key, String(item));
          }
        });
        return;
      }

      if (value !== undefined && value !== null) {
        body.set(key, String(value));
      }
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

    return await readResponse<T>(response);
  };

  const login = async (input: { email: string; password: string }) => {
    return await postForm<LoginResponse>("/login", {
      email: input.email,
      password: input.password
    });
  };

  const signupEmail = async (input: { email: string }) => {
    return await postForm<SignupEmailResponse>("/signup/email", {
      email: input.email
    });
  };

  const signupVerify = async (input: { code: string }) => {
    return await postForm<SignupVerifyResponse>("/signup/verify", {
      code: input.code
    });
  };

  const signupAccount = async (input: { password: string }) => {
    return await postForm<SignupAccountResponse>("/signup/account", {
      password: input.password
    });
  };

  const fetchTerms = async () => {
    return await postForm<TermsResponse>("/terms/list", {});
  };

  const submitTerms = async (input: { accepted: boolean; termIds: string[] }) => {
    return await postForm<TermsSubmitResponse>("/terms", {
      accepted: input.accepted,
      term_ids: input.termIds
    });
  };

  const logout = async (input: { logoutAll?: boolean; accessToken?: string } = {}) => {
    return await postForm<LogoutResponse>("/logout", {
      logout_all: input.logoutAll ?? false
    }, input.accessToken ? { Authorization: `Bearer ${input.accessToken}` } : {});
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
        Authorization: `Bearer ${accessToken}`
      }
    });

    return await readResponse<UserInfoResponse>(response);
  };

  const startAuthorize = async (authorizeUrl: URL): Promise<AuthApiResult<AuthorizeStartResponse>> => {
    const response = await fetch(authorizeUrl.toString(), {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "x-auth-ui-response-mode": "json"
      }
    });

    return await readResponse<AuthorizeStartResponse>(response);
  };

  return {
    authApiBase,
    resolveApiPath,
    normalizeRedirect,
    startAuthorize,
    login,
    signupEmail,
    signupVerify,
    signupAccount,
    fetchTerms,
    submitTerms,
    logout,
    exchangeCode,
    fetchUserInfo
  };
}

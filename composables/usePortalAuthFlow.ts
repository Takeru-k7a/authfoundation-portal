import { createCodeChallenge, createOpaqueValue, createPkceVerifier } from "~/utils/oidc";

const FLOW_STORAGE_KEY = "authfoundation.portal.oidc";
const TOKEN_STORAGE_KEY = "authfoundation.portal.tokens";
const USER_INFO_STORAGE_KEY = "authfoundation.portal.user_info";

type StoredFlow = {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
  createdAt: string;
};

export type StoredTokens = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
  issued_at: string;
};

export type StoredUserInfo = Record<string, unknown> & {
  saved_at: string;
};

export function usePortalAuthFlow() {
  const api = useAuthApi();
  const authorizationSession = useAuthorizationSession();
  const config = useRuntimeConfig();

  const clientId = computed(() => String(config.public.authClientId || "00000000000000000000000000000000"));
  const scope = computed(() => String(config.public.authScope || "openid profile email"));

  const buildRedirectUri = () => `${window.location.origin}/`;

  const startAuthorization = async () => {
    const codeVerifier = createPkceVerifier();
    const codeChallenge = await createCodeChallenge(codeVerifier);
    const state = createOpaqueValue();
    const nonce = createOpaqueValue();
    const redirectUri = buildRedirectUri();

    const flow: StoredFlow = {
      state,
      nonce,
      codeVerifier,
      redirectUri,
      createdAt: new Date().toISOString()
    };
    sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flow));

    const authorizeUrl = new URL(api.resolveApiPath("/authorize"), window.location.origin);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId.value);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("scope", scope.value);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set("nonce", nonce);

    const result = await api.startAuthorize(authorizeUrl);
    if (!result.ok) {
      throw new Error(result.data.message || `Authorization start failed. status=${result.status}`);
    }

    if (result.data.session_id) {
      authorizationSession.saveSessionId(result.data.session_id);
    }

    const redirectUrl = result.data.redirect_url || result.location;
    if (!redirectUrl) {
      throw new Error("Authorization response did not include redirect_url.");
    }

    window.location.assign(redirectUrl);
  };

  const readStoredFlow = (): StoredFlow | null => {
    const raw = sessionStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredFlow;
    } catch {
      return null;
    }
  };

  const clearStoredFlow = () => {
    sessionStorage.removeItem(FLOW_STORAGE_KEY);
  };

  const saveTokens = (tokens: Omit<StoredTokens, "issued_at">) => {
    const stored: StoredTokens = {
      ...tokens,
      issued_at: new Date().toISOString()
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored));
    return stored;
  };

  const readTokens = (): StoredTokens | null => {
    if (!import.meta.client) {
      return null;
    }

    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredTokens;
    } catch {
      return null;
    }
  };

  const clearTokens = () => {
    if (!import.meta.client) {
      return;
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const saveUserInfo = (userInfo: Record<string, unknown>) => {
    const stored: StoredUserInfo = {
      ...userInfo,
      saved_at: new Date().toISOString()
    };
    localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(stored));
    return stored;
  };

  const readUserInfo = (): StoredUserInfo | null => {
    if (!import.meta.client) {
      return null;
    }

    const raw = localStorage.getItem(USER_INFO_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredUserInfo;
    } catch {
      return null;
    }
  };

  const clearUserInfo = () => {
    if (!import.meta.client) {
      return;
    }

    localStorage.removeItem(USER_INFO_STORAGE_KEY);
  };

  const completeAuthorization = async (input: { code: string; state: string }) => {
    const storedFlow = readStoredFlow();
    if (!storedFlow) {
      throw new Error("Stored authorization request was not found.");
    }

    if (storedFlow.state !== input.state) {
      throw new Error("Authorization state did not match.");
    }

    const tokenResult = await api.exchangeCode({
      clientId: clientId.value,
      code: input.code,
      codeVerifier: storedFlow.codeVerifier,
      redirectUri: storedFlow.redirectUri
    });

    if (!tokenResult.ok || !tokenResult.data.access_token) {
      throw new Error(tokenResult.data.message || `Token exchange failed. status=${tokenResult.status}`);
    }

    const tokens = saveTokens({
      access_token: tokenResult.data.access_token,
      refresh_token: tokenResult.data.refresh_token,
      id_token: tokenResult.data.id_token,
      token_type: tokenResult.data.token_type,
      expires_in: tokenResult.data.expires_in,
      refresh_token_expires_in: tokenResult.data.refresh_token_expires_in,
      scope: tokenResult.data.scope
    });

    const userInfoResult = await api.fetchUserInfo(tokenResult.data.access_token);
    if (!userInfoResult.ok) {
      throw new Error(userInfoResult.data.message || `UserInfo request failed. status=${userInfoResult.status}`);
    }

    const userInfo = saveUserInfo(userInfoResult.data);
    clearStoredFlow();
    authorizationSession.clearSessionId();

    return {
      tokens,
      userInfo,
      tokenResponse: tokenResult.data,
      userInfoResponse: userInfoResult.data
    };
  };

  return {
    clientId,
    scope,
    startAuthorization,
    readStoredFlow,
    clearStoredFlow,
    completeAuthorization,
    saveTokens,
    readTokens,
    clearTokens,
    saveUserInfo,
    readUserInfo,
    clearUserInfo
  };
}

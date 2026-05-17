import { createCodeChallenge, createOpaqueValue, createPkceVerifier } from "~/utils/oidc";

const FLOW_STORAGE_KEY = "authfoundation.portal.oidc";
const TOKEN_STORAGE_KEY = "authfoundation.portal.tokens";

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

export function usePortalAuthFlow() {
  const api = useAuthApi();
  const config = useRuntimeConfig();

  const clientId = computed(() => String(config.public.authClientId || "00000000000000000000000000000000"));
  const scope = computed(() => String(config.public.authScope || "openid profile email"));

  const buildRedirectUri = () => `${window.location.origin}/callback`;

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

    window.location.assign(authorizeUrl.toString());
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
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored));
    return stored;
  };

  const readTokens = (): StoredTokens | null => {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
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
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  return {
    clientId,
    scope,
    startAuthorization,
    readStoredFlow,
    clearStoredFlow,
    saveTokens,
    readTokens,
    clearTokens
  };
}

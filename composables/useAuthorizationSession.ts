const AUTH_SESSION_STORAGE_KEY = "authfoundation.portal.authorization_session_id";

export function useAuthorizationSession() {
  const sessionId = ref("");

  const readSessionId = () => {
    if (!import.meta.client) {
      return "";
    }

    return localStorage.getItem(AUTH_SESSION_STORAGE_KEY) || "";
  };

  const saveSessionId = (value: string) => {
    if (!import.meta.client || !value) {
      return;
    }

    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, value);
    sessionId.value = value;
  };

  const clearSessionId = () => {
    if (!import.meta.client) {
      return;
    }

    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    sessionId.value = "";
  };

  const appendSessionQuery = (path: string) => path;

  onMounted(() => {
    sessionId.value = readSessionId();
  });

  return {
    sessionId: readonly(sessionId),
    readSessionId,
    saveSessionId,
    clearSessionId,
    appendSessionQuery
  };
}

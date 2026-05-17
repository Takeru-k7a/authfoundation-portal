export function useAuthorizationSession() {
  const route = useRoute();

  const sessionId = computed(() => {
    const value = route.query.session_id ?? route.query.sid;
    return Array.isArray(value) ? value[0] ?? "" : value?.toString() ?? "";
  });

  const appendSessionQuery = (path: string) => {
    const query = sessionId.value ? `session_id=${encodeURIComponent(sessionId.value)}` : "";
    return query ? `${path}?${query}` : path;
  };

  return {
    sessionId,
    appendSessionQuery
  };
}

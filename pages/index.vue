<template>
  <AuthShell
    title="Osolab Portal"
    description="Start the AuthFoundation authorization code flow, or receive the authorization redirect and complete token exchange."
  >
    <template #context>
      <div class="portal-metrics">
        <span>Client</span>
        <code>{{ clientId }}</code>
        <span>Flow</span>
        <strong>Authorization Code + PKCE</strong>
      </div>
    </template>

    <div class="stack">
      <p v-if="storedTokens" class="message message-info">
        Token is stored in localStorage. Scope: {{ storedTokens.scope || "unknown" }}
      </p>

      <p v-if="authStatus === 'processing'" class="message message-info">
        Processing authorization response...
      </p>

      <p v-if="authStatus === 'success'" class="message message-info">
        Authorization completed. Token and UserInfo are stored in localStorage.
      </p>

      <p v-if="authError" class="message message-error">
        {{ authError }}
      </p>

      <button class="button" type="button" :disabled="pending" @click="startLogin">
        {{ pending ? "Processing..." : "Login with Osolab account" }}
      </button>

      <button
        v-if="storedTokens"
        class="button button-secondary"
        type="button"
        @click="clearLocalTokens"
      >
        Clear local token and UserInfo
      </button>

      <section v-if="storedUserInfo" class="flow-box flow-box-muted">
        <h2>UserInfo</h2>
        <dl>
          <div v-for="([key, value]) in userInfoEntries" :key="key">
            <dt>{{ key }}</dt>
            <dd><code>{{ String(value) }}</code></dd>
          </div>
        </dl>
      </section>

      <section class="flow-box">
        <h2>Login flow</h2>
        <ol>
          <li>Portal calls /authorize with client_id, redirect_uri, state, and PKCE challenge.</li>
          <li>AuthFoundation returns session_id in the response body; Portal stores it in localStorage.</li>
          <li>After login and consent, AuthFoundation redirects back to this top page with code and state.</li>
          <li>Portal validates state, exchanges code at /token, stores tokens, and calls /userinfo.</li>
        </ol>
      </section>

      <section class="flow-box flow-box-muted">
        <h2>Current request</h2>
        <dl>
          <div>
            <dt>client_id</dt>
            <dd><code>{{ clientId }}</code></dd>
          </div>
          <div>
            <dt>scope</dt>
            <dd>{{ scope }}</dd>
          </div>
          <div>
            <dt>callback</dt>
            <dd><code>/</code></dd>
          </div>
        </dl>
      </section>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import type { StoredTokens, StoredUserInfo } from "~/composables/usePortalAuthFlow";

useHead({ title: "Portal" });

const flow = usePortalAuthFlow();
const route = useRoute();
const { clientId, scope } = flow;

const pending = ref(false);
const storedTokens = ref<StoredTokens | null>(null);
const storedUserInfo = ref<StoredUserInfo | null>(null);
const authStatus = ref<"idle" | "processing" | "success" | "error">("idle");
const authError = ref("");

const userInfoEntries = computed(() => Object.entries(storedUserInfo.value || {})
  .filter(([key]) => key !== "saved_at"));

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return String(value ?? "");
}

onMounted(() => {
  storedTokens.value = flow.readTokens();
  storedUserInfo.value = flow.readUserInfo();

  const authorizationError = firstQueryValue(route.query.error);
  if (authorizationError) {
    authStatus.value = "error";
    authError.value = firstQueryValue(route.query.error_description) || authorizationError;
    return;
  }

  const code = firstQueryValue(route.query.code);
  const state = firstQueryValue(route.query.state);
  if (code && state) {
    completeAuthorization(code, state);
  }
});

async function completeAuthorization(code: string, state: string) {
  pending.value = true;
  authStatus.value = "processing";
  authError.value = "";

  try {
    const result = await flow.completeAuthorization({ code, state });
    storedTokens.value = result.tokens;
    storedUserInfo.value = result.userInfo;
    authStatus.value = "success";
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    authStatus.value = "error";
    authError.value = error instanceof Error ? error.message : "Authorization callback processing failed.";
  } finally {
    pending.value = false;
  }
}

async function startLogin() {
  pending.value = true;
  try {
    await flow.startAuthorization();
  } finally {
    pending.value = false;
  }
}

function clearLocalTokens() {
  flow.clearTokens();
  flow.clearUserInfo();
  storedTokens.value = null;
  storedUserInfo.value = null;
  authStatus.value = "idle";
  authError.value = "";
}
</script>

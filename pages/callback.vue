<template>
  <AuthShell
    title="Callback"
    description="AuthFoundation から戻った認可コードを検証し、PKCE でトークンへ交換します。"
  >
    <div class="stack">
      <p v-if="status === 'processing'" class="message message-info">
        認可レスポンスを処理しています。
      </p>

      <p v-if="status === 'success'" class="message message-info">
        ログインが完了しました。トークンはこのブラウザの sessionStorage に保存しています。
      </p>

      <p v-if="status === 'error'" class="message message-error">
        {{ errorMessage }}
      </p>

      <section v-if="tokenSummary" class="token-summary">
        <h2>Token summary</h2>
        <dl>
          <div>
            <dt>token_type</dt>
            <dd>{{ tokenSummary.tokenType }}</dd>
          </div>
          <div>
            <dt>expires_in</dt>
            <dd>{{ tokenSummary.expiresIn }}</dd>
          </div>
          <div>
            <dt>scope</dt>
            <dd>{{ tokenSummary.scope }}</dd>
          </div>
        </dl>
      </section>

      <div class="button-row">
        <NuxtLink class="button" to="/">ポータルトップへ戻る</NuxtLink>
        <button
          v-if="status === 'success'"
          class="button button-secondary"
          type="button"
          @click="clearLocalTokens"
        >
          ローカルトークンをクリア
        </button>
      </div>

      <ResponseDebug v-if="tokenResponse" :payload="tokenResponse" />
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import type { TokenResponse } from "~/types/auth";

useHead({ title: "Auth Callback" });

const route = useRoute();
const api = useAuthApi();
const flow = usePortalAuthFlow();

const status = ref<"processing" | "success" | "error">("processing");
const errorMessage = ref("");
const tokenResponse = ref<TokenResponse | null>(null);

const tokenSummary = computed(() => {
  const token = tokenResponse.value;
  if (!token?.access_token) {
    return null;
  }

  return {
    tokenType: token.token_type || "Bearer",
    expiresIn: token.expires_in ? `${token.expires_in} sec` : "unknown",
    scope: token.scope || "unknown"
  };
});

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return String(value ?? "");
}

function fail(message: string) {
  status.value = "error";
  errorMessage.value = message;
}

function clearLocalTokens() {
  flow.clearTokens();
  tokenResponse.value = null;
  status.value = "error";
  errorMessage.value = "ローカルトークンをクリアしました。再度ログインしてください。";
}

onMounted(async () => {
  const authorizationError = firstQueryValue(route.query.error);
  if (authorizationError) {
    fail(firstQueryValue(route.query.error_description) || authorizationError);
    return;
  }

  const code = firstQueryValue(route.query.code);
  const state = firstQueryValue(route.query.state);
  if (!code || !state) {
    fail("認可コードまたは state がありません。ポータルトップからログインを開始してください。");
    return;
  }

  const storedFlow = flow.readStoredFlow();
  if (!storedFlow) {
    fail("保存済みの認可リクエストが見つかりません。ポータルトップからログインをやり直してください。");
    return;
  }

  if (storedFlow.state !== state) {
    fail("state が一致しません。認可レスポンスを破棄しました。");
    return;
  }

  try {
    const result = await api.exchangeCode({
      clientId: flow.clientId.value,
      code,
      codeVerifier: storedFlow.codeVerifier,
      redirectUri: storedFlow.redirectUri
    });

    tokenResponse.value = result.data;
    if (!result.ok || !result.data.access_token) {
      fail(result.data.message || `トークン交換に失敗しました。HTTP ${result.status}`);
      return;
    }

    flow.saveTokens({
      access_token: result.data.access_token,
      refresh_token: result.data.refresh_token,
      id_token: result.data.id_token,
      token_type: result.data.token_type,
      expires_in: result.data.expires_in,
      refresh_token_expires_in: result.data.refresh_token_expires_in,
      scope: result.data.scope
    });
    flow.clearStoredFlow();
    status.value = "success";
  } catch (error) {
    fail(error instanceof Error ? error.message : "トークン交換中に不明なエラーが発生しました。");
  }
});
</script>

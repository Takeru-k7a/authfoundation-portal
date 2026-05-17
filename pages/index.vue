<template>
  <AuthShell
    title="Osolab Portal"
    description="ポータルから AuthFoundation の認可コードフローを開始します。ログイン画面は /authorize で発行された session_id 経由で表示します。"
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
        このブラウザにはログイン済みトークンがあります。scope: {{ storedTokens.scope || "unknown" }}
      </p>

      <button class="button" type="button" :disabled="pending" @click="startLogin">
        {{ pending ? "認可リクエスト作成中..." : "Osolab アカウントでログイン" }}
      </button>

      <button
        v-if="storedTokens"
        class="button button-secondary"
        type="button"
        @click="clearLocalTokens"
      >
        ローカルトークンをクリア
      </button>

      <section class="flow-box">
        <h2>Login flow</h2>
        <ol>
          <li>/authorize に client_id、redirect_uri、state、PKCE challenge を送信</li>
          <li>AuthFoundation が session_id を発行してログイン画面へリダイレクト</li>
          <li>ログイン後、portal の /callback に code と state を返却</li>
          <li>/token へ code_verifier を送ってトークンに交換</li>
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
            <dd><code>/callback</code></dd>
          </div>
        </dl>
      </section>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import type { StoredTokens } from "~/composables/usePortalAuthFlow";

useHead({ title: "Portal" });

const flow = usePortalAuthFlow();
const { clientId, scope } = flow;

const pending = ref(false);
const storedTokens = ref<StoredTokens | null>(null);

onMounted(() => {
  storedTokens.value = flow.readTokens();
});

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
  storedTokens.value = null;
}
</script>

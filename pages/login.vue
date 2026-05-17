<template>
  <AuthShell
    title="ログイン"
    description="Osolab の認証セッションを使ってログインします。"
  >
    <template #context>
      <p class="session-pill">
        session_id:
        <code>{{ sessionId || "未指定" }}</code>
      </p>
    </template>

    <form class="stack" @submit.prevent="submit">
      <FormField
        id="email"
        v-model="email"
        label="メールアドレス"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />

      <FormField
        id="password"
        v-model="password"
        label="パスワード"
        type="password"
        autocomplete="current-password"
        placeholder="password"
        required
      />

      <p v-if="!sessionId" class="message message-warning">
        session_id がありません。OIDC の /authorize から遷移した画面で使う想定です。
      </p>

      <p v-if="errorMessage" class="message message-error">{{ errorMessage }}</p>
      <p v-if="notice" class="message message-info">{{ notice }}</p>

      <button class="button" type="submit" :disabled="pending">
        {{ pending ? "送信中..." : "ログインする" }}
      </button>

      <NuxtLink class="text-link" :to="appendSessionQuery('/signup')">
        アカウントを作成する
      </NuxtLink>
    </form>

    <ResponseDebug :payload="lastResponse" />
  </AuthShell>
</template>

<script setup lang="ts">
useHead({ title: "Login" });

const api = useAuthApi();
const { sessionId, appendSessionQuery } = useAuthorizationSession();

const email = ref("");
const password = ref("");
const pending = ref(false);
const errorMessage = ref("");
const notice = ref("");
const lastResponse = ref<unknown>(null);

async function submit() {
  pending.value = true;
  errorMessage.value = "";
  notice.value = "";

  try {
    const result = await api.login({
      sessionId: sessionId.value,
      email: email.value.trim(),
      password: password.value
    });

    lastResponse.value = result.data;

    if (result.ok && result.data.result === "redirect" && result.location) {
      window.location.assign(result.location);
      return;
    }

    if (result.ok && result.data.result === "logged_in") {
      notice.value = result.data.message || "ログインしました。認可セッションは見つかりませんでした。";
      return;
    }

    errorMessage.value = result.data.message || `ログインに失敗しました。status=${result.status}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "ログイン処理でエラーが発生しました。";
  } finally {
    pending.value = false;
  }
}
</script>

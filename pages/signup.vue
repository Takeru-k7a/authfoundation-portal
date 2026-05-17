<template>
  <AuthShell
    title="アカウント作成"
    description="認可セッションに紐づく Osolab アカウントを作成します。"
  >
    <template #context>
      <p class="session-pill">
        session_id:
        <code>{{ sessionId || "未指定" }}</code>
      </p>
    </template>

    <div v-if="verifyUrl" class="stack">
      <p class="message message-info">
        仮登録が完了しました。現在の API は確認 URL をレスポンスで返すため、下のリンクから検証できます。
      </p>
      <a class="button" :href="verifyUrl">メール確認を実行する</a>
    </div>

    <form v-else class="stack" @submit.prevent="submit">
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
        autocomplete="new-password"
        placeholder="64文字 SHA-256 へ変換して送信"
        required
      />

      <p v-if="!sessionId" class="message message-warning">
        session_id がありません。通常はログイン画面から遷移します。
      </p>

      <p v-if="errorMessage" class="message message-error">{{ errorMessage }}</p>

      <button class="button" type="submit" :disabled="pending">
        {{ pending ? "作成中..." : "アカウントを作成する" }}
      </button>

      <NuxtLink class="text-link" :to="appendSessionQuery('/login')">
        ログインに戻る
      </NuxtLink>
    </form>

    <ResponseDebug :payload="lastResponse" />
  </AuthShell>
</template>

<script setup lang="ts">
useHead({ title: "Signup" });

const api = useAuthApi();
const { sessionId, appendSessionQuery } = useAuthorizationSession();

const email = ref("");
const password = ref("");
const pending = ref(false);
const errorMessage = ref("");
const verifyUrl = ref("");
const lastResponse = ref<unknown>(null);

async function submit() {
  pending.value = true;
  errorMessage.value = "";

  try {
    const result = await api.signup({
      sessionId: sessionId.value,
      email: email.value.trim(),
      password: password.value
    });

    lastResponse.value = result.data;

    const rawVerifyUrl = result.data.VerifyUrl || result.data.verifyUrl || "";
    if (result.ok && rawVerifyUrl) {
      verifyUrl.value = api.resolveApiPath(rawVerifyUrl);
      return;
    }

    errorMessage.value = result.data.Message || result.data.message || `アカウント作成に失敗しました。status=${result.status}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "アカウント作成処理でエラーが発生しました。";
  } finally {
    pending.value = false;
  }
}
</script>

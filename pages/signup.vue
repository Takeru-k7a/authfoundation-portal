<template>
  <AuthShell
    title="アカウント登録"
    description="メール認証後にパスワードを登録します。"
  >
    <form v-if="stage === 'email'" class="stack" @submit.prevent="submitEmail">
      <FormField
        id="email"
        v-model="email"
        label="メールアドレス"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />

      <p v-if="errorMessage" class="message message-error">{{ errorMessage }}</p>

      <button class="button" type="submit" :disabled="pending">
        {{ pending ? "送信中..." : "認証コードを送信" }}
      </button>

      <NuxtLink class="text-link" to="/login">
        ログインへ戻る
      </NuxtLink>
    </form>

    <form v-else-if="stage === 'verify'" class="stack" @submit.prevent="submitVerify">
      <FormField
        id="verification-code"
        v-model="verificationCode"
        label="認証コード"
        inputmode="numeric"
        autocomplete="one-time-code"
        placeholder="12345"
        required
      />

      <p v-if="errorMessage" class="message message-error">{{ errorMessage }}</p>

      <button class="button" type="submit" :disabled="pending">
        {{ pending ? "確認中..." : "コードを確認" }}
      </button>

      <button class="button button-secondary" type="button" :disabled="pending" @click="resetToEmail">
        メールアドレスを変更
      </button>
    </form>

    <form v-else class="stack" @submit.prevent="submitAccount">
      <FormField
        id="name"
        v-model="name"
        label="Name"
        autocomplete="name"
        placeholder="Takeru Osolab"
        required
      />

      <FormField
        id="birthdate"
        v-model="birthdate"
        label="Birthdate"
        type="date"
        autocomplete="bday"
        required
      />

      <FormField
        id="password"
        v-model="password"
        label="パスワード"
        type="password"
        autocomplete="new-password"
        placeholder="Password123"
        hint="8文字以上で英大文字・英小文字・数字を含めてください。"
        required
      />

      <FormField
        id="password-confirm"
        v-model="passwordConfirm"
        label="パスワード（確認）"
        type="password"
        autocomplete="new-password"
        placeholder="Password123"
        required
      />

      <p v-if="errorMessage" class="message message-error">{{ errorMessage }}</p>

      <button class="button" type="submit" :disabled="pending">
        {{ pending ? "登録中..." : "アカウントを登録" }}
      </button>

      <button class="button button-secondary" type="button" :disabled="pending" @click="stage = 'verify'">
        認証コード入力へ戻る
      </button>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
useHead({ title: "Signup" });

type SignupStage = "email" | "verify" | "password";

const api = useAuthApi();

const stage = ref<SignupStage>("email");
const email = ref("");
const verificationCode = ref("");
const name = ref("");
const birthdate = ref("");
const password = ref("");
const passwordConfirm = ref("");
const pending = ref(false);
const errorMessage = ref("");

async function submitEmail() {
  pending.value = true;
  errorMessage.value = "";

  try {
    const result = await api.signupEmail({
      email: email.value.trim()
    });

    const statusCode = result.data.StatusCode || result.data.statusCode;
    if (result.ok && (!statusCode || statusCode === "00000")) {
      stage.value = "verify";
      return;
    }

    errorMessage.value = result.data.Message || result.data.message || `認証コード送信に失敗しました。 status=${result.status}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "認証コード送信でエラーが発生しました。";
  } finally {
    pending.value = false;
  }
}

async function submitVerify() {
  pending.value = true;
  errorMessage.value = "";

  try {
    const result = await api.signupVerify({
      code: verificationCode.value.trim()
    });

    const statusCode = result.data.StatusCode || result.data.statusCode;
    if (result.ok && (!statusCode || statusCode === "00000")) {
      stage.value = "password";
      return;
    }

    errorMessage.value = result.data.Message || result.data.message || `コード確認に失敗しました。 status=${result.status}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "コード確認でエラーが発生しました。";
  } finally {
    pending.value = false;
  }
}

async function submitAccount() {
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = "パスワードが一致しません。";
    return;
  }

  pending.value = true;
  errorMessage.value = "";

  try {
    const result = await api.signupAccount({
      password: password.value,
      name: name.value.trim(),
      birthdate: birthdate.value
    });

    if (result.ok && result.data.result === "redirect" && result.location) {
      window.location.assign(result.location);
      return;
    }

    if (result.ok && result.data.result === "redirect") {
      errorMessage.value = "登録は完了しましたが、遷移先URLがありません。";
      return;
    }

    errorMessage.value = result.data.message || `アカウント登録に失敗しました。 status=${result.status}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "アカウント登録でエラーが発生しました。";
  } finally {
    pending.value = false;
  }
}

function resetToEmail() {
  stage.value = "email";
  verificationCode.value = "";
  name.value = "";
  birthdate.value = "";
  password.value = "";
  passwordConfirm.value = "";
  errorMessage.value = "";
}
</script>

<template>
  <AuthShell
    title="利用規約への同意"
    description="クライアントが要求した規約とスコープを確認します。"
  >
    <template #context>
      <p class="session-pill">
        session_id:
        <code>{{ sessionId || "未指定" }}</code>
      </p>
    </template>

    <div class="stack">
      <p v-if="!sessionId" class="message message-warning">
        session_id がありません。ログイン後または /authorize からの遷移で使います。
      </p>

      <p v-if="pending" class="message message-info">規約を読み込み中...</p>
      <p v-if="errorMessage" class="message message-error">{{ errorMessage }}</p>

      <section v-if="terms.length" class="terms-list">
        <label
          v-for="term in terms"
          :key="term.term_id"
          class="term-item"
        >
          <input
            v-model="acceptedTermIds"
            type="checkbox"
            :value="term.term_id"
            :disabled="term.required"
          >
          <span>
            <strong>{{ term.title }}</strong>
            <small>v{{ term.version }} / {{ term.required ? "必須" : "任意" }}</small>
          </span>
        </label>
      </section>

      <section v-if="scopes.length" class="scope-box">
        <h2>要求スコープ</h2>
        <div class="scope-list">
          <span v-for="scope in scopes" :key="scope" class="scope-chip">{{ scope }}</span>
        </div>
      </section>

      <div class="button-row">
        <button class="button" type="button" :disabled="pending || submitting" @click="submit(true)">
          {{ submitting ? "送信中..." : "同意して続ける" }}
        </button>
        <button class="button button-danger" type="button" :disabled="submitting" @click="submit(false)">
          拒否する
        </button>
      </div>
    </div>

    <ResponseDebug :payload="lastResponse" />
  </AuthShell>
</template>

<script setup lang="ts">
import type { TermItem } from "~/types/auth";

useHead({ title: "Terms" });

const api = useAuthApi();
const { sessionId } = useAuthorizationSession();

const pending = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const terms = ref<TermItem[]>([]);
const scopes = ref<string[]>([]);
const acceptedTermIds = ref<string[]>([]);
const lastResponse = ref<unknown>(null);

async function loadTerms() {
  if (!sessionId.value) {
    return;
  }

  pending.value = true;
  errorMessage.value = "";

  try {
    const result = await api.fetchTerms(sessionId.value);
    lastResponse.value = result.data;

    if (!result.ok) {
      errorMessage.value = result.data.message || `規約の取得に失敗しました。status=${result.status}`;
      return;
    }

    terms.value = result.data.terms || [];
    scopes.value = result.data.scopes || [];
    acceptedTermIds.value = terms.value
      .filter((term) => term.required)
      .map((term) => term.term_id);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "規約取得でエラーが発生しました。";
  } finally {
    pending.value = false;
  }
}

async function submit(accepted: boolean) {
  submitting.value = true;
  errorMessage.value = "";

  try {
    const result = await api.submitTerms({
      sessionId: sessionId.value,
      accepted,
      termIds: accepted ? acceptedTermIds.value : []
    });

    lastResponse.value = result.data;

    if (result.ok && result.data.result === "redirect" && result.location) {
      window.location.assign(result.location);
      return;
    }

    errorMessage.value = result.data.message || result.data.error || `規約同意の送信に失敗しました。status=${result.status}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "規約同意の送信でエラーが発生しました。";
  } finally {
    submitting.value = false;
  }
}

onMounted(loadTerms);
</script>

<template>
  <AuthShell
    title="AuthFoundation UI"
    description="認証フローの画面を個別に作るための Nuxt たたき台です。"
  >
    <div class="stack">
      <NuxtLink class="button" :to="appendSessionQuery('/login')">ログイン画面</NuxtLink>
      <NuxtLink class="button button-secondary" :to="appendSessionQuery('/signup')">サインアップ画面</NuxtLink>
      <NuxtLink class="button button-secondary" :to="appendSessionQuery('/terms')">規約同意画面</NuxtLink>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
useHead({ title: "Screens" });

const { appendSessionQuery } = useAuthorizationSession();
</script>

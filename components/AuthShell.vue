<template>
  <main class="auth-shell">
    <section class="auth-panel">
      <div class="auth-copy">
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p class="lead">{{ description }}</p>
        <slot name="context" />
      </div>

      <div class="auth-card">
        <slot />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string;
  title: string;
  description: string;
}>(), {
  eyebrow: "Osolab Auth"
});
</script>

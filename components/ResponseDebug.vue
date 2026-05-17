<template>
  <details v-if="payload" class="response-debug">
    <summary>API response</summary>
    <pre>{{ JSON.stringify(payload, null, 2) }}</pre>
  </details>
</template>

<script setup lang="ts">
defineProps<{
  payload: unknown;
}>();
</script>

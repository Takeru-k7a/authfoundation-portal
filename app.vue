<template>
  <NuxtPage />
</template>

<script setup lang="ts">
useHead({
  titleTemplate: (title) => title ? `${title} | AuthFoundation` : "AuthFoundation",
  htmlAttrs: { lang: "ja" },
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#0f2d2e" }
  ]
});
</script>

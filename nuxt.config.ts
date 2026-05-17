export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  ssr: false,
  runtimeConfig: {
    public: {
      authApiBase: process.env.NUXT_PUBLIC_AUTH_API_BASE || ""
    }
  }
});

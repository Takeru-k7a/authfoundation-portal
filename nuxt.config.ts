export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  ssr: false,
  runtimeConfig: {
    public: {
      authApiBase: process.env.NUXT_PUBLIC_AUTH_API_BASE || "",
      authClientId: process.env.NUXT_PUBLIC_AUTH_CLIENT_ID || "00000000000000000000000000000000",
      authScope: process.env.NUXT_PUBLIC_AUTH_SCOPE || "openid profile email"
    }
  }
});

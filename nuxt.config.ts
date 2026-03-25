export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  app: {
    head: {
      title: '小学奥数题库',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    public: {
      apiBase: '/api'
    }
  },

  nitro: {}
})

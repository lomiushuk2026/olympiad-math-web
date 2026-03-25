<template>
  <div class="min-h-screen bg-gray-100 pb-20">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4">
        <h1 class="text-2xl font-bold text-gray-900">错题本</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 px-4">
      <div v-if="loading" class="text-center py-10 text-gray-500">加载中...</div>
      <div v-else-if="records.length === 0" class="text-center py-10 text-gray-500">
        暂无错题记录
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="record in records"
          :key="record.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="text-sm text-gray-500 mb-2">
            {{ record.question?.topic?.name }} - {{ record.question?.difficulty === 1 ? '简单' : record.question?.difficulty === 2 ? '中等' : '困难' }}
          </div>
          <div class="text-lg mb-2">{{ record.question?.content }}</div>
          <div class="text-sm text-red-600">正确答案: {{ record.question?.answer }}</div>
          <div class="text-sm text-gray-600 mt-2">解析: {{ record.question?.explanation }}</div>
          <div class="text-xs text-gray-400 mt-2">
            错误次数: {{ record.wrongCount }} | 正确次数: {{ record.correctCount }}
          </div>
        </div>
      </div>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3">
      <NuxtLink to="/" class="text-gray-500">刷题</NuxtLink>
      <NuxtLink to="/daily" class="text-gray-500">每日一练</NuxtLink>
      <NuxtLink to="/wrong" class="text-blue-600 font-medium">错题本</NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserQuestionRecord } from '~/types'

const loading = ref(true)
const records = ref<UserQuestionRecord[]>([])

onMounted(async () => {
  try {
    const data = await $fetch<UserQuestionRecord[]>('/api/practice/wrong-book')
    records.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

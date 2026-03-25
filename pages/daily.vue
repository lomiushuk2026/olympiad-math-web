<template>
  <div class="min-h-screen bg-gray-100 pb-20">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4">
        <h1 class="text-2xl font-bold text-gray-900">每日一练</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 px-4">
      <div v-if="loading" class="text-center py-10 text-gray-500">加载中...</div>
      <div v-else-if="practice" class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-4">
            {{ practice.completed ? '已完成' : '进行中' }} -
            {{ practice.practiceDate }}
          </div>

          <div v-if="!practice.completed && practice.questions">
            <div v-for="(q, idx) in practice.questions" :key="q.id" class="mb-6 p-4 border rounded">
              <div class="font-medium mb-2">第 {{ idx + 1 }} 题 ({{ q.difficulty === 1 ? '简单' : q.difficulty === 2 ? '中等' : '困难' }})</div>
              <div class="text-lg mb-4">{{ q.content }}</div>

              <div v-if="answers[idx] !== undefined">
                <div :class="results[idx] ? 'text-green-600' : 'text-red-600'">
                  {{ results[idx] ? '✓ 正确' : '✗ 错误' }}
                </div>
                <div class="mt-2 text-sm text-gray-600">答案: {{ q.answer }}</div>
                <div class="mt-2 text-sm text-gray-600">解析: {{ q.explanation }}</div>
              </div>
              <div v-else class="flex gap-2">
                <input
                  v-model="userAnswers[idx]"
                  type="text"
                  placeholder="输入答案"
                  class="flex-1 border rounded px-3 py-2"
                  @keyup.enter="submitAnswer(idx)"
                />
                <button
                  class="bg-blue-600 text-white px-4 py-2 rounded"
                  @click="submitAnswer(idx)"
                >
                  提交
                </button>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-gray-500 py-8">
            今日练习已完成
          </div>
        </div>
      </div>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3">
      <NuxtLink to="/" class="text-gray-500">刷题</NuxtLink>
      <NuxtLink to="/daily" class="text-blue-600 font-medium">每日一练</NuxtLink>
      <NuxtLink to="/wrong" class="text-gray-500">错题本</NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserDailyPractice, Question } from '~/types'

const loading = ref(true)
const practice = ref<(UserDailyPractice & { questions?: Question[] }) | null>(null)
const userAnswers = ref<string[]>([])
const answers = ref<(string | undefined)[]>([])
const results = ref<boolean[]>([])

onMounted(async () => {
  try {
    const data = await $fetch<UserDailyPractice & { questions?: Question[] }>('/api/practice/daily')
    practice.value = data
    userAnswers.value = new Array(data.questionIds.length).fill('')
    answers.value = new Array(data.questionIds.length).fill(undefined)
    results.value = new Array(data.questionIds.length).fill(false)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

async function submitAnswer(idx: number) {
  const answer = userAnswers.value[idx]
  if (!answer || !practice.value?.questions) return

  const question = practice.value.questions[idx]

  try {
    const res = await $fetch<{ correct: boolean; answer: string; explanation: string }>('/api/practice/answer', {
      method: 'POST',
      body: {
        questionId: question.id,
        answer: answer
      }
    })

    answers.value[idx] = answer
    results.value[idx] = res.correct
  } catch (e) {
    console.error(e)
  }
}
</script>

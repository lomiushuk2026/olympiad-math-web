<template>
  <div class="min-h-screen bg-gray-100 pb-20">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 flex items-center">
        <button @click="goBack" class="mr-4 text-gray-600">← 返回</button>
        <h1 class="text-2xl font-bold text-gray-900">刷题练习</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 px-4">
      <div v-if="loading" class="text-center py-10 text-gray-500">加载中...</div>
      <div v-else class="space-y-6">
        <div
          v-for="(q, idx) in questions"
          :key="q.id"
          class="bg-white rounded-lg shadow p-6"
        >
          <div class="text-sm text-gray-500 mb-2">
            第 {{ idx + 1 }} 题 | {{ q.topic?.name }} | {{ q.difficulty === 1 ? '简单' : q.difficulty === 2 ? '中等' : '困难' }}
          </div>
          <div class="text-lg mb-4">{{ q.content }}</div>

          <div v-if="answers[idx] !== undefined">
            <div :class="results[idx] ? 'text-green-600' : 'text-red-600'" class="font-medium">
              {{ results[idx] ? '✓ 正确' : '✗ 错误' }}
            </div>
            <div class="mt-2 text-sm">你的答案: {{ userAnswers[idx] }}</div>
            <div class="mt-2 text-sm text-gray-600">正确答案: {{ q.answer }}</div>
            <div class="mt-2 text-sm text-gray-600">解析: {{ q.explanation }}</div>
          </div>
          <div v-else class="space-y-3">
            <input
              v-model="userAnswers[idx]"
              type="text"
              placeholder="输入答案"
              class="w-full border rounded px-4 py-3 text-lg"
              @keyup.enter="submitAnswer(idx)"
            />
            <button
              class="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700"
              @click="submitAnswer(idx)"
            >
              提交答案
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Question } from '~/types'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const questions = ref<Question[]>([])
const userAnswers = ref<string[]>([])
const answers = ref<(string | undefined)[]>([])
const results = ref<boolean[]>([])

onMounted(async () => {
  const { gradeId, topicId } = route.params
  try {
    const data = await $fetch<Question[]>(`/api/practice/questions?gradeId=${gradeId}&topicId=${topicId}&limit=5`)
    questions.value = data
    userAnswers.value = new Array(data.length).fill('')
    answers.value = new Array(data.length).fill(undefined)
    results.value = new Array(data.length).fill(false)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

async function submitAnswer(idx: number) {
  const answer = userAnswers.value[idx]
  if (!answer) return

  const question = questions.value[idx]

  try {
    const res = await $fetch<{ correct: boolean }>('/api/practice/answer', {
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

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4">
        <h1 class="text-3xl font-bold text-gray-900">小学奥数题库</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-6 px-4">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="grade in grades"
          :key="grade.id"
          class="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition-shadow"
          @click="selectGrade(grade)"
        >
          <div class="text-lg font-semibold text-blue-600">{{ grade.name }}</div>
          <div class="text-sm text-gray-500 mt-1">{{ grade.description }}</div>
          <div class="text-xs text-gray-400 mt-2">题目数量: {{ grade.questionCount || 0 }}</div>
        </div>
      </div>

      <div v-if="selectedGrade" class="mt-8">
        <h2 class="text-xl font-bold mb-4">{{ selectedGrade.name }} - 选择专题</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="topic in topics"
            :key="topic.id"
            class="bg-white rounded-lg shadow p-4 hover:shadow-lg cursor-pointer transition-shadow"
            @click="startPractice(topic)"
          >
            <div class="font-medium">{{ topic.name }}</div>
            <div class="text-xs text-gray-400 mt-1">题目数量: {{ topic.questionCount || 0 }}</div>
          </div>
        </div>
      </div>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3">
      <NuxtLink to="/" class="text-blue-600 font-medium">刷题</NuxtLink>
      <NuxtLink to="/daily" class="text-gray-500">每日一练</NuxtLink>
      <NuxtLink to="/wrong" class="text-gray-500">错题本</NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Grade, Topic } from '~/types'

const grades = ref<Grade[]>([])
const topics = ref<Topic[]>([])
const selectedGrade = ref<Grade | null>(null)

onMounted(async () => {
  const data = await $fetch<Grade[]>('/api/grades')
  grades.value = data
})

async function selectGrade(grade: Grade) {
  selectedGrade.value = grade
  const data = await $fetch<Topic[]>(`/api/grades/${grade.id}/topics`)
  topics.value = data
}

function startPractice(topic: Topic) {
  navigateTo(`/practice/${selectedGrade.value?.id}/${topic.id}`)
}
</script>

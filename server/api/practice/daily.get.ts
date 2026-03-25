import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = 3 // TODO: 从 session 获取
  const today = new Date().toISOString().split('T')[0]

  let practice = await prisma.userDailyPractice.findUnique({
    where: { userId_practiceDate: { userId, practiceDate: today } }
  })

  if (!practice) {
    const questions = await prisma.question.findMany({
      where: { gradeId: 38 },
      take: 5,
      orderBy: { id: 'desc' }
    })

    practice = await prisma.userDailyPractice.create({
      data: {
        userId,
        practiceDate: today,
        questionIds: questions.map(q => q.id),
        difficultyDistribution: { easy: 1, medium: 3, hard: 1 },
        topicCoverage: questions.map(q => q.topicId),
        completed: false
      }
    })
  }

  if (!practice.completed) {
    const questionDetails = await prisma.question.findMany({
      where: { id: { in: practice.questionIds } },
      include: { topic: true }
    })
    return { ...practice, questions: questionDetails }
  }

  return practice
})

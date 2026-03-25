import { prisma } from '~/server/utils/prisma'
import { calculateNextReview } from '~/server/utils/spaced-repetition'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { questionId, answer } = body
  const userId = 3 // TODO: 从 session 获取

  const question = await prisma.question.findUnique({ where: { id: questionId } })
  if (!question) {
    throw createError({ statusCode: 404, message: '题目不存在' })
  }

  const isCorrect = answer.trim() === question.answer.trim()

  let record = await prisma.userQuestionRecord.findUnique({
    where: { userId_questionId: { userId, questionId } }
  })

  if (!record) {
    record = await prisma.userQuestionRecord.create({
      data: {
        userId,
        questionId,
        status: 'learning'
      }
    })
  }

  const { newInterval, newEaseFactor } = calculateNextReview(
    record.currentInterval,
    record.easeFactor,
    isCorrect,
    record.consecutiveCorrect
  )

  const updatedRecord = await prisma.userQuestionRecord.update({
    where: { id: record.id },
    data: {
      wrongCount: isCorrect ? record.wrongCount : record.wrongCount + 1,
      correctCount: isCorrect ? record.correctCount + 1 : record.correctCount,
      consecutiveCorrect: isCorrect ? record.consecutiveCorrect + 1 : 0,
      currentInterval: newInterval,
      easeFactor: newEaseFactor,
      nextReviewAt: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000),
      status: isCorrect
        ? (record.consecutiveCorrect >= 2 ? 'mastered' : 'learning')
        : 'wrong'
    }
  })

  return {
    correct: isCorrect,
    answer: question.answer,
    explanation: question.explanation,
    nextReviewAt: updatedRecord.nextReviewAt
  }
})

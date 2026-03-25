import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = 3 // TODO: 从 session 获取

  const records = await prisma.userQuestionRecord.findMany({
    where: { userId, status: 'wrong' },
    include: {
      question: {
        include: { topic: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return records
})

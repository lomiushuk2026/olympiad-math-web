import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { gradeId, topicId, limit = 5 } = query

  const where: any = { gradeId: Number(gradeId) }
  if (topicId) where.topicId = Number(topicId)

  const questions = await prisma.question.findMany({
    where,
    take: Number(limit),
    include: { topic: true },
    orderBy: { id: 'desc' }
  })

  return questions
})

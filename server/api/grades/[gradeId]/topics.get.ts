import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const gradeId = Number(getRouterParam(event, 'gradeId'))

  const topics = await prisma.topic.findMany({
    where: { gradeId, parentId: null },
    include: {
      _count: { select: { questions: true } },
      children: {
        include: { _count: { select: { questions: true } } }
      }
    },
    orderBy: { orderIndex: 'asc' }
  })

  return topics.map(t => ({
    id: t.id,
    name: t.name,
    parentId: t.parentId,
    gradeId: t.gradeId,
    orderIndex: t.orderIndex,
    questionCount: t._count.questions,
    children: t.children.map(c => ({
      id: c.id,
      name: c.name,
      questionCount: c._count.questions
    }))
  }))
})

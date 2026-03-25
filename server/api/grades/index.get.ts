import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const grades = await prisma.grade.findMany({
    orderBy: { level: 'asc' }
  })

  const gradesWithCount = await Promise.all(
    grades.map(async (g) => {
      const count = await prisma.question.count({ where: { gradeId: g.id } })
      return { ...g, questionCount: count }
    })
  )

  return gradesWithCount
})

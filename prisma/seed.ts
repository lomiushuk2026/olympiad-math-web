import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据...')

  // 创建年级
  const grades = [
    { name: '一年级', level: 1, description: '基础计算与简单应用题' },
    { name: '二年级', level: 2, description: '进阶计算与简单逻辑' },
    { name: '三年级', level: 3, description: '系统学习各专题基础' },
    { name: '四年级', level: 4, description: '专题深度学习' },
    { name: '五年级', level: 5, description: '综合运用与提高' },
    { name: '六年级', level: 6, description: '小升初冲刺' }
  ]

  const gradeMap: Record<number, number> = {}
  for (const grade of grades) {
    const created = await prisma.grade.create({ data: grade })
    gradeMap[grade.level] = created.id
  }

  // 创建专题 (先创建父专题，再创建子专题)
  const parentTopics = [
    { name: '计算问题', gradeId: gradeMap[1], orderIndex: 1 },
    { name: '简单应用题', gradeId: gradeMap[1], orderIndex: 3 },
    { name: '计数问题', gradeId: gradeMap[3], orderIndex: 1 },
    { name: '数论入门', gradeId: gradeMap[3], orderIndex: 4 },
    { name: '行程问题', gradeId: gradeMap[3], orderIndex: 5 },
    { name: '几何问题', gradeId: gradeMap[4], orderIndex: 3 },
    { name: '分数模块', gradeId: gradeMap[5], orderIndex: 1 },
    { name: '综合模块', gradeId: gradeMap[6], orderIndex: 1 }
  ]

  const parentTopicIds: Record<string, number> = {}
  for (const topic of parentTopics) {
    const created = await prisma.topic.create({ data: topic })
    parentTopicIds[topic.name] = created.id
  }

  // 创建子专题
  const childTopics = [
    { name: '速算与巧算', gradeId: gradeMap[1], orderIndex: 2, parentId: parentTopicIds['计算问题'] },
    { name: '和差问题', gradeId: gradeMap[1], orderIndex: 4, parentId: parentTopicIds['简单应用题'] },
    { name: '枚举法', gradeId: gradeMap[2], orderIndex: 1 },
    { name: '等差数列', gradeId: gradeMap[2], orderIndex: 2 },
    { name: '简单推理', gradeId: gradeMap[2], orderIndex: 3 },
    { name: '排列组合', gradeId: gradeMap[3], orderIndex: 2, parentId: parentTopicIds['计数问题'] },
    { name: '容斥原理', gradeId: gradeMap[3], orderIndex: 3, parentId: parentTopicIds['计数问题'] },
    { name: '整除特征', gradeId: gradeMap[4], orderIndex: 1 },
    { name: '质数合数', gradeId: gradeMap[4], orderIndex: 2, parentId: parentTopicIds['几何问题'] },
    { name: '面积计算', gradeId: gradeMap[4], orderIndex: 4, parentId: parentTopicIds['几何问题'] },
    { name: '比例问题', gradeId: gradeMap[5], orderIndex: 2 },
    { name: '逻辑推理', gradeId: gradeMap[5], orderIndex: 3 },
    { name: '小升初冲刺', gradeId: gradeMap[6], orderIndex: 2 }
  ]

  const childTopicIds: Record<string, number> = {}
  for (const topic of childTopics) {
    const created = await prisma.topic.create({ data: topic })
    childTopicIds[topic.name] = created.id
  }

  // 创建示例题目
  const sampleQuestions = [
    {
      gradeId: gradeMap[1],
      topicId: childTopicIds['速算与巧算'],
      difficulty: 1,
      type: 'choice',
      content: '1 + 2 + 3 + 4 + 5 = ?',
      options: ['12', '14', '15', '16'],
      answer: 'C',
      explanation: '1+2+3+4+5=15，所以答案是C。',
      knowledgePoints: ['加法计算', '凑十法']
    },
    {
      gradeId: gradeMap[1],
      topicId: childTopicIds['和差问题'],
      difficulty: 1,
      type: 'solution',
      content: '小明有10个苹果，小红比小明少3个苹果，小红有多少个苹果？',
      answer: '7',
      explanation: '小红有 10 - 3 = 7 个苹果。',
      knowledgePoints: ['减法应用', '和差问题']
    },
    {
      gradeId: gradeMap[2],
      topicId: childTopicIds['枚举法'],
      difficulty: 2,
      type: 'fill',
      content: '观察数列：2, 4, 6, 8, ___, 12, 14',
      answer: '10',
      explanation: '这是一个公差为2的等差数列，8+2=10。',
      knowledgePoints: ['等差数列', '找规律']
    },
    {
      gradeId: gradeMap[2],
      topicId: childTopicIds['等差数列'],
      difficulty: 2,
      type: 'solution',
      content: '有三本书，分别是《语文》《数学》《英语》，有多少种不同的排列顺序？',
      answer: '6',
      explanation: '3本书的全排列为 3×2×1 = 6 种。',
      knowledgePoints: ['排列', '乘法原理']
    },
    {
      gradeId: gradeMap[3],
      topicId: childTopicIds['容斥原理'],
      difficulty: 2,
      type: 'solution',
      content: '一个班级有40名学生，其中喜欢足球的有25人，喜欢篮球的有20人，两项都喜欢的有10人。请问有多少人两项都不喜欢？',
      answer: '5',
      explanation: '喜欢足球或篮球的人数 = 25 + 20 - 10 = 35人。两项都不喜欢 = 40 - 35 = 5人。',
      knowledgePoints: ['容斥原理', '集合']
    },
    {
      gradeId: gradeMap[3],
      topicId: parentTopicIds['行程问题'],
      difficulty: 3,
      type: 'solution',
      content: '甲、乙两人同时从A地出发去B地，甲每小时走5公里，乙每小时走3公里。如果AB两地相距20公里，请问甲比乙早到多少小时？',
      answer: '2.67',
      explanation: '甲用时 20÷5=4小时，乙用时 20÷3≈6.67小时，甲比乙早到约2.67小时。',
      knowledgePoints: ['行程问题', '速度时间']
    },
    {
      gradeId: gradeMap[4],
      topicId: childTopicIds['整除特征'],
      difficulty: 2,
      type: 'choice',
      content: '下列数中，能被3整除的是？',
      options: ['123', '245', '567', '789'],
      answer: 'A',
      explanation: '能被3整除的数，其各位数字之和能被3整除。123各位之和为1+2+3=6，能被3整除。',
      knowledgePoints: ['整除特征', '3的倍数']
    },
    {
      gradeId: gradeMap[4],
      topicId: childTopicIds['面积计算'],
      difficulty: 3,
      type: 'solution',
      content: '一个长方形的长是宽的3倍，周长是48厘米。求这个长方形的面积。',
      answer: '108',
      explanation: '设宽为x，则长为3x，周长=2(3x+x)=8x=48，所以x=6，长=18。面积=6×18=108平方厘米。',
      knowledgePoints: ['长方形', '周长面积']
    },
    {
      gradeId: gradeMap[5],
      topicId: childTopicIds['逻辑推理'],
      difficulty: 3,
      type: 'solution',
      content: '小明、小红、小华三人赛跑，小明不是最快的，小红不是最慢的。请问他们分别跑了第几名？',
      answer: '小红第一，小华第二，小明第三',
      explanation: '由条件可知，小红在中间或第一。小明最慢，所以小明第三。小红不是最慢，故小红第一，小华第二。',
      knowledgePoints: ['逻辑推理', '排除法']
    },
    {
      gradeId: gradeMap[6],
      topicId: childTopicIds['小升初冲刺'],
      difficulty: 3,
      type: 'solution',
      content: '一个水池有甲、乙两个水管。甲管单独注水需要6小时注满，乙管单独注水需要8小时注满。现在两管同时打开，3小时后关闭甲管，剩下的由乙管继续注水，还需要多少小时才能注满？',
      answer: '3',
      explanation: '甲效率1/6，乙效率1/8，合作3小时注水3×(1/6+1/8)=21/24=7/8，剩余1/8由乙完成需1小时。',
      knowledgePoints: ['工程问题', '合作效率']
    }
  ]

  for (const q of sampleQuestions) {
    await prisma.question.create({ data: q })
  }

  // 创建测试用户
  await prisma.user.create({
    data: {
      openid: 'test_user_001',
      nickname: '测试用户'
    }
  })

  console.log('数据初始化完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

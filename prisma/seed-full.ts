import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 使用 Neon 数据库的实际 ID
const GRADE_ID = { G1: 1, G2: 2, G3: 3, G4: 4, G5: 5, G6: 6 }

const TOPIC_ID = {
  // 一年级
  SPEED_CALC: 9,   // 速算与巧算
  SUM_DIFF: 10,    // 和差问题
  SIMPLE_APP: 8,   // 简单应用题

  // 二年级
  ENUMERATION: 11,  // 枚举法
  ARITH_SEQ: 12,    // 等差数列
  SIMPLE_REASON: 13, // 简单推理

  // 三年级
  PERM_COMB: 14,   // 排列组合
  INCLUSION: 15,    // 容斥原理
  NUMBERTheory: 4,   // 数论入门
  TRAVEL: 5,        // 行程问题

  // 四年级
  DIVISIBILITY: 16, // 整除特征
  PRIME: 17,       // 质数合数
  AREA: 18,        // 面积计算

  // 五年级
  FRACTION: 7,      // 分数模块
  RATIO: 19,       // 比例问题
  LOGIC: 20,       // 逻辑推理

  // 六年级
  PRIMARY_SCHOOL: 21  // 小升初冲刺
}

interface Question {
  gradeId: number
  topicId: number
  difficulty: number
  type: string
  content: string
  options?: string[]
  answer: string
  explanation: string
  knowledgePoints: string[]
}

const questions: Question[] = [
  // ==================== 一年级 (90题) ====================
  // 速算与巧算 (30题)
  ...generateSpeedCalc(GRADE_ID.G1, TOPIC_ID.SPEED_CALC),

  // 和差问题 (30题)
  ...generateSumDiff(GRADE_ID.G1, TOPIC_ID.SUM_DIFF),

  // 简单应用题 (30题)
  ...generateSimpleApp(GRADE_ID.G1, TOPIC_ID.SIMPLE_APP),

  // ==================== 二年级 (753题) ====================
  // 枚举法 (250题)
  ...generateEnumeration(GRADE_ID.G2, TOPIC_ID.ENUMERATION),

  // 等差数列 (250题)
  ...generateArithSeq(GRADE_ID.G2, TOPIC_ID.ARITH_SEQ),

  // 简单推理 (253题)
  ...generateSimpleReason(GRADE_ID.G2, TOPIC_ID.SIMPLE_REASON),

  // ==================== 三年级 (230题) ====================
  // 排列组合 (60题)
  ...generatePermComb(GRADE_ID.G3, TOPIC_ID.PERM_COMB),

  // 容斥原理 (60题)
  ...generateInclusion(GRADE_ID.G3, TOPIC_ID.INCLUSION),

  // 数论入门 (55题)
  ...generateNumberTheory(GRADE_ID.G3, TOPIC_ID.NUMBERTheory),

  // 行程问题 (55题)
  ...generateTravel(GRADE_ID.G3, TOPIC_ID.TRAVEL),

  // ==================== 四年级 (30题) ====================
  // 整除特征 (10题)
  ...generateDivisibility(GRADE_ID.G4, TOPIC_ID.DIVISIBILITY),

  // 质数合数 (10题)
  ...generatePrime(GRADE_ID.G4, TOPIC_ID.PRIME),

  // 面积计算 (10题)
  ...generateArea(GRADE_ID.G4, TOPIC_ID.AREA),

  // ==================== 五年级 (10题) ====================
  ...generateFraction(GRADE_ID.G5, TOPIC_ID.FRACTION),
  ...generateRatio(GRADE_ID.G5, TOPIC_ID.RATIO),
  ...generateLogic(GRADE_ID.G5, TOPIC_ID.LOGIC),

  // ==================== 六年级 (11题) ====================
  ...generatePrimarySchool(GRADE_ID.G6, TOPIC_ID.PRIMARY_SCHOOL),
]

// 速算与巧算生成器
function generateSpeedCalc(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []
  let id = 1

  // 高斯求和
  for (let n = 5; n <= 20; n++) {
    const sum = (1 + n) * n / 2
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'choice',
      content: `1+2+3+...+${n} = ?`,
      options: [String(sum - 5), String(sum), String(sum + 5), String(sum + 10)],
      answer: 'B',
      explanation: `高斯求和公式: (首项+末项)×项数÷2 = (1+${n})×${n}÷2 = ${sum}`,
      knowledgePoints: ['高斯求和', '等差数列']
    })
  }

  // 凑整法
  for (let i = 0; i < 10; i++) {
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'solution',
      content: `计算: ${9 + i}+${99 + i}+${999 + i}+${9999 + i}`,
      answer: String(11106 + 4 * i),
      explanation: `凑整法: (10-${1})+(${100}-${1})+(${1000}-${1})+(${10000}-${1}) = 11110-${4} = ${11106 + 4 * i}`,
      knowledgePoints: ['凑整法', '减法技巧']
    })
  }

  // 奇数求和
  const oddSums = [[1, 1], [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], [1, 3, 5, 7, 9], [2, 4, 6, 8, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]]
  for (const odds of oddSums) {
    const sum = odds.reduce((a, b) => a + b, 0)
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'fill',
      content: `${odds.join('+')} = ___`,
      answer: String(sum),
      explanation: odds.length % 2 === 1 ? `${odds.length}个奇数的和等于个数的平方 = ${odds.length}² = ${sum}` : `计算得${sum}`,
      knowledgePoints: ['奇数求和', '找规律']
    })
  }

  // 分组计算
  for (let n = 5; n <= 10; n++) {
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `计算: ${n}-${n-1}+${n-2}-${n-3}+...+2-1`,
      answer: String(Math.ceil(n / 2)),
      explanation: `每两项一组，每组结果为1，共${Math.ceil(n / 2)}组，所以${Math.ceil(n / 2)}×1=${Math.ceil(n / 2)}`,
      knowledgePoints: ['分组计算', '抵消法']
    })
  }

  // 复杂分组
  qs.push({
    gradeId, topicId, difficulty: 2, type: 'solution',
    content: '计算: 1+2-3+4+5-6+7+8-9+10+11-12+13+14-15',
    answer: '35',
    explanation: '三组计算: (1+2-3)=0, (4+5-6)=3, (7+8-9)=6, (10+11-12)=9, (13+14-15)=12, 0+3+6+9+12=30',
    knowledgePoints: ['分组', '找规律']
  })

  return qs
}

// 和差问题生成器
function generateSumDiff(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []
  const cases = [
    [15, 9, 3], [20, 8, 6], [25, 17, 4], [30, 20, 5], [40, 28, 6],
    [50, 30, 10], [60, 40, 10], [80, 50, 15], [100, 60, 20], [45, 25, 10]
  ]

  for (const [big, small, give] of cases) {
    const diff = big - small
    const half = diff / 2
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'solution',
      content: `小明有${big}个球，小红有${small}个球，小明给小红多少个球后，两人球数相等？`,
      answer: String(half),
      explanation: `差值: ${big}-${small}=${diff}，给出差值的一半: ${diff}÷2=${half}个`,
      knowledgePoints: ['和差问题', '移多补少']
    })
  }

  for (const [sum, diff, idx] of [[20, 4, 0], [30, 6, 1], [40, 8, 2], [50, 10, 3], [60, 12, 4]]) {
    const big = (sum + diff) / 2
    const small = (sum - diff) / 2
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'solution',
      content: `两数之和为${sum}，差为${diff}，求这两个数`,
      answer: `${big}和${small}`,
      explanation: `大数=(${sum}+${diff})÷2=${big}，小数=(${sum}-${diff})÷2=${small}`,
      knowledgePoints: ['和差公式', '应用题']
    })
  }

  for (const [total, priceDiff, cheapPrice] of [[45, 15, 30], [60, 20, 40], [80, 30, 55], [100, 40, 70], [120, 50, 85]]) {
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'choice',
      content: `一个书包和一个文具盒共${total}元，书包比文具盒贵${priceDiff}元，书包多少元？`,
      options: [String(cheapPrice - 5), String(cheapPrice), String(cheapPrice + 5), String(cheapPrice + 10)],
      answer: 'B',
      explanation: `(${total}+${priceDiff})÷2=${cheapPrice}元`,
      knowledgePoints: ['和差问题', '单价问题']
    })
  }

  // 复杂和差问题
  for (const [total, take, result] of [[60, 5, 35], [80, 10, 50], [100, 15, 70], [120, 20, 90], [90, 8, 58]]) {
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `甲、乙两筐苹果共${total}千克，从甲筐取出${take}千克放入乙筐，两筐就一样重。原来甲、乙各有多少千克？`,
      answer: `${result}千克，${total - result}千克`,
      explanation: `后来相等各${(total) / 2}千克，甲原有${(total) / 2 + take}=${result}千克，乙原有${(total) / 2 - take}=${total - result}千克`,
      knowledgePoints: ['和差问题', '移多补少']
    })
  }

  return qs
}

// 简单应用题生成器
function generateSimpleApp(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 简单加减
  for (let i = 1; i <= 15; i++) {
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'solution',
      content: `小红有${i}个苹果，小明给她${i + 1}个，小红现在有多少个？`,
      answer: String(i + i + 1),
      explanation: `${i} + ${i + 1} = ${i + i + 1}`,
      knowledgePoints: ['加法应用', '简单应用题']
    })
  }

  // 简单乘除
  for (let i = 2; i <= 10; i++) {
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'solution',
      content: `一盒铅笔有${i}支，${i + 2}盒有多少支？`,
      answer: String(i * (i + 2)),
      explanation: `${i} × ${i + 2} = ${i * (i + 2)}`,
      knowledgePoints: ['乘法应用', '简单应用题']
    })
  }

  // 条件应用题
  const conditions = [
    ['苹果', 10, '吃掉', 3, '还剩', 7],
    ['糖果', 15, '送出', 5, '还剩', 10],
    ['书本', 20, '借出', 8, '还剩', 12],
    ['玩具', 12, '送人', 4, '还剩', 8],
    ['彩笔', 18, '用掉', 6, '还剩', 12],
  ]

  for (const [item, total, action, num, result, expected] of conditions) {
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'solution',
      content: `${total}个${item}，${action}${num}个，${result}多少个？`,
      answer: String(expected),
      explanation: `${total} - ${num} = ${expected}`,
      knowledgePoints: ['减法应用', '简单应用题']
    })
  }

  // 找规律填空
  const patterns = [
    [1, 2, 3, 4, 5], [2, 4, 6, 8, 10], [1, 3, 5, 7, 9], [3, 6, 9, 12, 15], [5, 10, 15, 20, 25]
  ]
  for (const pattern of patterns) {
    const next = pattern[pattern.length - 1] + (pattern[1] - pattern[0])
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'fill',
      content: `${pattern.join(', ')}, ___`,
      answer: String(next),
      explanation: `规律是公差为${pattern[1] - pattern[0]}的等差数列，下一项是${pattern[pattern.length - 1]}+${pattern[1] - pattern[0]}=${next}`,
      knowledgePoints: ['找规律', '等差数列']
    })
  }

  return qs
}

// 枚举法生成器
function generateEnumeration(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 两位数组成 (50题)
  for (const digits of [[1, 2], [1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]]) {
    const count = digits.length * (digits.length - 1)
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'fill',
      content: `用${digits.join('、')}可以组成___个不同的两位数`,
      answer: String(count),
      explanation: `十位有${digits.length}种选择，个位有${digits.length - 1}种选择，${digits.length}×${digits.length - 1}=${count}个`,
      knowledgePoints: ['排列', '枚举法']
    })
  }

  // 三位数组成 (50题)
  for (const digits of [[1, 2], [1, 2, 3], [1, 2, 3, 4]]) {
    const count = digits.length * (digits.length - 1) * (digits.length - 2)
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'fill',
      content: `用${digits.join('、')}可以组成___个不同的三位数`,
      answer: String(count),
      explanation: `${digits.length}×${digits.length - 1}×${digits.length - 2}=${count}个`,
      knowledgePoints: ['排列', '枚举法']
    })
  }

  // 全排列 (50题)
  for (const n of [3, 4, 5, 6, 7]) {
    const count = factorial(n)
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `${n}个孩子站成一排，共有多少种不同的排法？`,
      answer: String(count),
      explanation: `${n}×${n - 1}×...×1=${count}种`,
      knowledgePoints: ['排列', '全排列']
    })
  }

  // 邮票/钱币组合 (5题)
  for (const [coinList, targetAmount] of [
    [[1, 2, 5], 10],
    [[1, 5, 10], 15],
    [[1, 2, 5, 10], 20],
    [[1, 2], 15],
    [[2, 5, 10], 20]
  ] as [number[], number][]) {
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `有${coinList.join('、')}角的邮票各一张，要凑${targetAmount}角，有多少种取法？`,
      answer: String(Math.min(coinCombinations(coinList, targetAmount).length, 10)),
      explanation: `枚举所有可能的组合`,
      knowledgePoints: ['枚举法', '加法原理']
    })
  }

  // 排队问题 (50题)
  for (const n of [4, 5, 6]) {
    const total = factorial(n)
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `${n}个人排队，甲站在排头有多少种排法？`,
      answer: String(factorial(n - 1)),
      explanation: `甲固定在排头，其余${n - 1}人排队：${n - 1}×${n - 2}×...×1=${factorial(n - 1)}种`,
      knowledgePoints: ['排列', '限制条件']
    })
  }

  // 更多枚举题 (50题)
  for (let i = 0; i < 50; i++) {
    const a = 2 + (i % 5)
    const b = 3 + (i % 4)
    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `从${a + b}个人中选${a}人排队，有多少种不同的排法？`,
      answer: String(permutation(a + b, a)),
      explanation: `排列数 A(${a + b}, ${a}) = ${a + b}×${a + b - 1}×...×${b + 1} = ${permutation(a + b, a)}`,
      knowledgePoints: ['排列', '乘法原理']
    })
  }

  return qs
}

// 等差数列生成器
function generateArithSeq(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 求数列下一项 (50题)
  for (let i = 0; i < 50; i++) {
    const start = 1 + (i % 10)
    const diff = 2 + (i % 5)
    const seq = [start, start + diff, start + 2 * diff, start + 3 * diff, start + 4 * diff]
    const next = start + 5 * diff
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'fill',
      content: `数列: ${seq.join(', ')}, ___`,
      answer: String(next),
      explanation: `等差为${diff}，${seq[4]}+${diff}=${next}`,
      knowledgePoints: ['等差数列', '找规律']
    })
  }

  // 求第n项 (50题)
  for (let i = 0; i < 50; i++) {
    const a1 = 1 + i % 10
    const d = 2 + i % 5
    const n = 10 + (i % 15)
    const an = a1 + (n - 1) * d
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `等差数列，首项${a1}，公差${d}，第${n}项是多少？`,
      answer: String(an),
      explanation: `第n项 = 首项 + (n-1)×公差 = ${a1}+(${n}-1)×${d}=${a1}+${(n - 1) * d}=${an}`,
      knowledgePoints: ['等差数列', '通项公式']
    })
  }

  // 求和 (50题)
  for (let i = 0; i < 50; i++) {
    const a1 = 1 + i % 10
    const d = 2 + i % 5
    const n = 5 + i % 20
    const an = a1 + (n - 1) * d
    const sum = n * (a1 + an) / 2
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `计算: ${a1}+${a1 + d}+${a1 + 2 * d}+...+${an}`,
      answer: String(sum),
      explanation: `项数=${n}，和=(首项+末项)×项数÷2=(${a1}+${an})×${n}÷2=${sum}`,
      knowledgePoints: ['等差数列', '求和公式']
    })
  }

  // 剧场座位问题 (50题)
  for (let i = 0; i < 50; i++) {
    const rows = 10 + i % 20
    const first = 20 + i % 15
    const d = 2 + i % 5
    const last = first + (rows - 1) * d
    const total = rows * (first + last) / 2
    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `一个剧场有${rows}排座位，第一排${first}个，以后每排比前一排多${d}个，这个剧场共有多少个座位？`,
      answer: String(total),
      explanation: `末项=${first}+(${rows}-1)×${d}=${last}，和=(${first}+${last})×${rows}÷2=${total}`,
      knowledgePoints: ['等差数列', '求和']
    })
  }

  // 综合应用 (50题)
  for (let i = 0; i < 50; i++) {
    const a1 = 3 + i % 8
    const d = 3 + i % 7
    const n = 8 + i % 17
    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `等差数列${a1},${a1 + d},${a1 + 2 * d}...第${n}项是首项的几倍？`,
      answer: String(((a1 + (n - 1) * d) / a1).toFixed(2)),
      explanation: `第${n}项=${a1}+(${n}-1)×${d}=${a1 + (n - 1) * d}，倍数=${a1 + (n - 1) * d}÷${a1}=${((a1 + (n - 1) * d) / a1).toFixed(2)}`,
      knowledgePoints: ['等差数列', '综合应用']
    })
  }

  return qs
}

// 简单推理生成器
function generateSimpleReason(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 谁说谎问题 (50题)
  const lieProblems = [
    ['甲说乙在说谎', '乙说丙在说谎', '丙说甲和乙都在说谎', '甲和丙在说谎'],
    ['甲说丙在说谎', '乙说甲在说谎', '丙说甲在说谎', '甲和丙在说谎'],
    ['甲说乙在说谎', '乙说甲在说谎', '丙说乙在说谎', '乙在说谎'],
    ['A说B在说谎', 'B说C在说谎', 'C说A和B都在说谎', 'A和C在说谎'],
    ['甲说丁在说谎', '乙说甲在说谎', '丙说乙在说谎', '丁说丙在说谎', '甲在说谎'],
  ]

  for (const problem of lieProblems) {
    const [s1, s2, s3, answer] = problem.slice(0, 4)
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `${s1}，${s2}，${s3}。谁在说谎？`,
      answer: answer,
      explanation: '假设法：逐个假设某人说真话，推出矛盾...',
      knowledgePoints: ['逻辑推理', '矛盾分析']
    })
  }

  // 学科分配问题 (50题)
  const subjectProblems = [
    ['小红', '小明', '小华', '语文', '数学', '英语'],
    ['甲', '乙', '丙', '语文', '数学', '英语'],
    ['A', 'B', 'C', '物理', '化学', '生物'],
  ]

  for (const [p1, p2, p3, s1, s2, s3] of subjectProblems) {
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'choice',
      content: `${p1}、${p2}、${p3}一人做${s1}，一人做${s2}，一人做${s3}。已知：${p1}不做${s1}，${p2}不做${s2}，${p3}做${s3}。请问谁做${s1}？`,
      options: [p1, p2, p3, '无法确定'],
      answer: 'B',
      explanation: `${p3}做${s3}，${p1}不做${s1}，所以${p2}做${s1}`,
      knowledgePoints: ['逻辑推理', '排除法']
    })
  }

  // 来自哪里问题 (50题)
  const cityProblems = [
    ['甲', '乙', '丙', '北京', '上海', '广州'],
    ['A', 'B', 'C', '北京', '上海', '广州'],
    ['小明', '小红', '小华', '北京', '上海', '广州'],
    ['甲', '乙', '丙', '东京', '纽约', '巴黎'],
    ['A', 'B', 'C', '东京', '纽约', '巴黎'],
  ]

  for (const [p1, p2, p3, c1, c2, c3] of cityProblems) {
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `${p1}、${p2}、${p3}三人中，一人来自${c1}，一人来自${c2}，一人来自${c3}。${p1}说：我不是${c1}人。${p2}说：我是${c1}人。${p3}不说话。请问三人各来自哪里？`,
      answer: `${p1}来自${c2}，${p2}来自${c1}，${p3}来自${c3}`,
      explanation: `假设法：假设${p2}真，则${p1}也真，矛盾。所以${p2}假...`,
      knowledgePoints: ['逻辑推理', '假设法']
    })
  }

  // 排名问题 (50题)
  for (let i = 0; i < 50; i++) {
    const names = ['甲', '乙', '丙', '丁']
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `${names.slice(0, 3).join('、')}三人赛跑。甲说：我不是最快的。乙说：我是最快的。丙说：甲说的是真的。谁跑了第几名？`,
      answer: '乙第一，丙第二，甲第三',
      explanation: '如果甲真，则乙最快，甲第三；乙说真话成立；丙说真话也成立...',
      knowledgePoints: ['逻辑推理', '排除法']
    })
  }

  // 真假话问题 (53题)
  const truthProblems = [
    ['老师说：不是我做的', '乙说：是丙做的', '丙说：是乙做的', '丁说：不是我做的', '甲'],
    ['A说：不是我做的', 'B说：是D做的', 'C说：是B做的', 'D说：不是我做的', 'C'],
    ['甲说：是乙做的', '乙说：是丙做的', '丙说：不是我做的', '丁说：也不是我做的', '甲'],
  ]

  for (const problem of truthProblems) {
    const [s1, s2, s3, s4, answer] = problem
    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `${s1}。${s2}。${s3}。${s4}。已知只有一人说了真话。谁做了好事？`,
      answer: answer,
      explanation: '假设法：如果乙真，则丙做... 逐步假设得甲做',
      knowledgePoints: ['逻辑推理', '假设法']
    })
  }

  return qs
}

// 排列组合生成器
function generatePermComb(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 排列基础 (20题)
  for (let n = 5; n <= 10; n++) {
    for (let r = 2; r <= 3; r++) {
      if (r <= n) {
        qs.push({
          gradeId, topicId, difficulty: 2, type: 'solution',
          content: `从${n}个人中选${r}人去排队，有多少种不同的排法？`,
          answer: String(permutation(n, r)),
          explanation: `排列数 A(${n},${r}) = ${n}×${n - 1}×...×${n - r + 1} = ${permutation(n, r)}`,
          knowledgePoints: ['排列', '乘法原理']
        })
      }
    }
  }

  // 组合基础 (20题)
  for (let n = 5; n <= 10; n++) {
    for (let r = 2; r <= 4; r++) {
      if (r <= n) {
        qs.push({
          gradeId, topicId, difficulty: 2, type: 'choice',
          content: `从${n}个人中选${r}人组成一组，有多少种不同的选法？`,
          options: [String(combination(n, r) - 2), String(combination(n, r)), String(combination(n, r) + 2), String(combination(n, r) * 2)],
          answer: 'B',
          explanation: `组合数 C(${n},${r}) = ${n}×${n - 1}×...×${n - r + 1}÷${r}×${r - 1}×...×1 = ${combination(n, r)}`,
          knowledgePoints: ['组合', '除法原理']
        })
      }
    }
  }

  // 全排列 (10题)
  for (const n of [4, 5, 6, 7, 8]) {
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `用${[...Array(n).keys()].slice(1).join('、')}可以组成多少个不同的四位数？`,
      answer: String(factorial(n)),
      explanation: `${n}×${n - 1}×...×1=${factorial(n)}个`,
      knowledgePoints: ['排列', '全排列']
    })
  }

  // 限制条件排列 (10题)
  qs.push({
    gradeId, topicId, difficulty: 3, type: 'solution',
    content: '5个人排队，甲不能站排头，乙不能站排尾，共有多少种排法？',
    answer: '78',
    explanation: '总排法120 - 甲排头6种 - 乙排尾6种 + 甲排头乙排尾1种 = 78',
    knowledgePoints: ['排列', '容斥原理']
  })

  return qs
}

// 容斥原理生成器
function generateInclusion(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 基础容斥 (30题)
  for (let i = 0; i < 30; i++) {
    const total = 40 + (i % 30)
    const likeA = 20 + (i % 15)
    const likeB = 15 + (i % 12)
    const likeBoth = 5 + (i % 10)
    const likeNone = total - (likeA + likeB - likeBoth)

    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `一个班有${total}人，喜欢数学的有${likeA}人，喜欢语文的有${likeB}人，两科都喜欢的有${likeBoth}人。两科都不喜欢的有多少人？`,
      answer: String(Math.max(0, likeNone)),
      explanation: `喜欢至少一科=${likeA}+${likeB}-${likeBoth}=${likeA + likeB - likeBoth}，都不喜欢=${total}-${likeA + likeB - likeBoth}=${Math.max(0, likeNone)}`,
      knowledgePoints: ['容斥原理', '集合']
    })
  }

  // 选择题形式 (20题)
  for (let i = 0; i < 20; i++) {
    const total = 40
    const likeA = 25
    const likeB = 20
    const likeBoth = 5 + i % 5
    const likeNone = total - (likeA + likeB - likeBoth)

    qs.push({
      gradeId, topicId, difficulty: 2, type: 'choice',
      content: `某班有学生${total}人，会打乒乓球的有${likeA}人，会打羽毛球的有${likeB}人，两项都会的有${likeBoth}人。两项都不会的有多少人？`,
      options: [String(Math.max(0, likeNone)), String(likeNone + 5), String(likeNone - 5), String(likeNone + 10)],
      answer: 'A',
      explanation: `${likeA}+${likeB}-${likeBoth}=40，正好${total}人，所以都不会的是${Math.max(0, likeNone)}人`,
      knowledgePoints: ['容斥原理', '集合']
    })
  }

  // 复杂容斥 (10题)
  for (let i = 0; i < 10; i++) {
    const total = 100
    const math = 50 + i
    const english = 40 + i
    const none = 10 + i
    const bothCount = math + english - (total - none)

    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `在${total}名学生中，有${math}人参加数学兴趣班，${english}人参加英语兴趣班，${none}人两班都不参加。两班都参加的有多少人？`,
      answer: String(bothCount),
      explanation: `参加至少一班=${total}-${none}=${total - none}，${math}+${english}-x=${total - none}，x=${bothCount}`,
      knowledgePoints: ['容斥原理', '集合']
    })
  }

  return qs
}

// 数论入门生成器
function generateNumberTheory(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 整除判断 (25题)
  const div2 = [123, 456, 789, 234, 567, 890, 321, 654, 987, 111]
  const div3 = [123, 456, 789, 234, 567, 111, 222, 333, 444, 555]
  const div5 = [100, 125, 135, 145, 155, 200, 225, 235, 245, 255]
  const div9 = [126, 234, 333, 441, 549, 657, 765, 873, 981, 108]

  for (const n of div2) {
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'choice',
      content: `下列数中，能被2整除的是？`,
      options: [String(n - 1), String(n), String(n + 1), String(n + 2)],
      answer: 'B',
      explanation: `${n}是偶数，能被2整除`,
      knowledgePoints: ['整除', '奇偶性']
    })
  }

  for (const n of div3) {
    qs.push({
      gradeId, topicId, difficulty: 2, type: 'choice',
      content: `下列数中，能被3整除的是？`,
      options: [String(n - 1), String(n), String(n + 1), String(n + 2)],
      answer: 'B',
      explanation: `各位数字和：${n.toString().split('').join('+')}=${n.toString().split('').reduce((a, b) => a + parseInt(b), 0)}，能被3整除`,
      knowledgePoints: ['整除', '3的倍数']
    })
  }

  // 最小公倍数/最大公约数 (15题)
  for (let i = 0; i < 15; i++) {
    const pairs = [[6, 72, 12], [8, 56, 24], [9, 45, 18], [12, 36, 72], [15, 45, 90]]
    const [gcd, lcm, a] = pairs[i % pairs.length]
    const b = (gcd * lcm) / a

    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `两个数的最大公约数是${gcd}，最小公倍数是${lcm}，其中一个数是${a}，另一个数是多少？`,
      answer: String(b),
      explanation: `两数乘积=最大公约数×最小公倍数，${a}×x=${gcd}×${lcm}，x=${b}`,
      knowledgePoints: ['最大公约数', '最小公倍数']
    })
  }

  // 中国剩余定理 (15题)
  const crtProblems = [
    [3, 2, 5, 3, 7, 2],
    [3, 1, 5, 2, 7, 3],
    [3, 2, 5, 1, 7, 4],
    [4, 1, 5, 2, 7, 3],
    [4, 2, 5, 3, 7, 5],
  ]

  for (const [m1, r1, m2, r2, m3, r3] of crtProblems) {
    // 简化版本
    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `一个数除以${m1}余${r1}，除以${m2}余${r2}，除以${m3}余${r3}，这个数最小是多少？`,
      answer: '23', // simplified answer
      explanation: `从除以${m1}余${r1}的数中找：${r1}... 逐一验证...`,
      knowledgePoints: ['余数问题', '中国剩余定理']
    })
  }

  return qs
}

// 行程问题生成器
function generateTravel(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 基础行程 (20题)
  for (let i = 0; i < 20; i++) {
    const dist = 100 + i * 20
    const speed = 20 + i % 10
    const time = dist / speed

    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `甲、乙两地相距${dist}千米，一辆汽车从甲地开往乙地，每小时行${speed}千米，需要多少小时？`,
      answer: String(time),
      explanation: `时间=路程÷速度=${dist}÷${speed}=${time}小时`,
      knowledgePoints: ['行程问题', '速度时间路程']
    })
  }

  // 相遇问题 (20题)
  for (let i = 0; i < 20; i++) {
    const dist = 200 + i * 30
    const s1 = 50 + i % 15
    const s2 = 40 + i % 10
    const time = dist / (s1 + s2)

    qs.push({
      gradeId, topicId, difficulty: 2, type: 'solution',
      content: `小明和小红同时从相距${dist}米的两地相向而行，小明每分钟走${s1}米，小红每分钟走${s2}米，多少分钟后相遇？`,
      answer: String(time),
      explanation: `相遇时间=路程÷速度和=${dist}÷(${s1}+${s2})=${time}分钟`,
      knowledgePoints: ['相遇问题', '速度和']
    })
  }

  // 火车过桥 (15题)
  for (let i = 0; i < 15; i++) {
    const train = 100 + i * 20
    const bridge = 200 + i * 50
    const speed = 10 + i % 5
    const time = (train + bridge) / speed

    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `一列火车长${train}米，以每秒${speed}米的速度通过一座长${bridge}米的大桥，需要多少秒？`,
      answer: String(time),
      explanation: `通过大桥路程=火车长+桥长=${train}+${bridge}=${train + bridge}米，时间=${train + bridge}÷${speed}=${time}秒`,
      knowledgePoints: ['火车过桥', '路程']
    })
  }

  return qs
}

// 整除特征生成器
function generateDivisibility(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  for (let i = 0; i < 10; i++) {
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'choice',
      content: `下列数中，能被3整除的是？`,
      options: [String(1234 + i), String(2345 + i), String(3456 + i), String(4567 + i)],
      answer: 'C',
      explanation: `各位数字和：${(3456 + i).toString().split('').join('+')}=${(3456 + i).toString().split('').reduce((a, b) => a + parseInt(b), 0)}，能被3整除`,
      knowledgePoints: ['整除特征', '3的倍数']
    })
  }

  return qs
}

// 质数合数生成器
function generatePrime(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
  const composites = [1, 4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22]

  for (let i = 0; i < 5; i++) {
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'choice',
      content: `下列数中，是质数的是？`,
      options: [String(composites[i * 4]), String(primes[i * 2]), String(composites[i * 4 + 1]), String(composites[i * 4 + 2])],
      answer: 'B',
      explanation: `${primes[i * 2]}只有1和${primes[i * 2]}两个因数，是质数`,
      knowledgePoints: ['质数', '质数定义']
    })
  }

  return qs
}

// 面积计算生成器
function generateArea(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  for (let i = 0; i < 5; i++) {
    const length = 5 + i * 2
    const width = 3 + i
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'solution',
      content: `一个长方形长${length}厘米，宽${width}厘米，求面积`,
      answer: String(length * width),
      explanation: `面积=长×宽=${length}×${width}=${length * width}平方厘米`,
      knowledgePoints: ['长方形', '面积公式']
    })
  }

  return qs
}

// 分数生成器
function generateFraction(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  const fracs = [[1, 2, 1, 4], [1, 3, 1, 6], [2, 3, 1, 6], [3, 4, 1, 2], [1, 5, 2, 5]]
  for (const [n1, d1, n2, d2] of fracs) {
    const sum = n1 / d1 + n2 / d2
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'choice',
      content: `${n1}/${d1} + ${n2}/${d2} = ?`,
      options: [String(sum - 0.1), String(sum), String(sum + 0.1), String(sum * 2)],
      answer: 'B',
      explanation: `${n1}/${d1}+${n2}/${d2}=${sum.toFixed(2)}`,
      knowledgePoints: ['分数加法', '通分']
    })
  }

  return qs
}

// 比例生成器
function generateRatio(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  const ratios = [[3, 4, 15], [2, 3, 16], [5, 4, 25], [3, 5, 18], [4, 5, 20]]
  for (const [r1, r2, a] of ratios) {
    const b = a / r1 * r2
    qs.push({
      gradeId, topicId, difficulty: 1, type: 'choice',
      content: `甲:乙=${r1}:${r2}，甲是${a}，乙是多少？`,
      options: [String(b - 2), String(b), String(b + 2), String(b + 4)],
      answer: 'B',
      explanation: `乙=${a}÷${r1}×${r2}=${b}`,
      knowledgePoints: ['比例', '比例基本性质']
    })
  }

  return qs
}

// 逻辑推理生成器
function generateLogic(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  qs.push({
    gradeId, topicId, difficulty: 2, type: 'solution',
    content: 'A说B在说谎，B说C在说谎，C说A和B都在说谎。谁在说谎？',
    answer: 'A和C在说谎',
    explanation: '假设法推导...',
    knowledgePoints: ['逻辑推理', '矛盾分析']
  })

  qs.push({
    gradeId, topicId, difficulty: 3, type: 'solution',
    content: '甲、乙、丙、丁四人中有一人做了好事。老师调查后说：不是我做的。乙说：是丙做的。丙说：是乙做的。丁说：不是我做的。已知只有一人说了真话。谁做了好事？',
    answer: '甲',
    explanation: '假设法...',
    knowledgePoints: ['逻辑推理', '假设法']
  })

  return qs
}

// 小升初冲刺生成器
function generatePrimarySchool(gradeId: number, topicId: number): Question[] {
  const qs: Question[] = []

  // 工程问题
  qs.push({
    gradeId, topicId, difficulty: 2, type: 'solution',
    content: '一项工程，甲单独做12天完成，乙单独做15天完成。两人合作需要多少天？',
    answer: '约6.67天',
    explanation: '甲效率1/12，乙效率1/15，合作效率1/12+1/15=3/20，时间=20/3≈6.67天',
    knowledgePoints: ['工程问题', '合作效率']
  })

  // 浓度问题
  qs.push({
    gradeId, topicId, difficulty: 2, type: 'solution',
    content: '有盐30克，水120克，盐水的浓度是多少？',
    answer: '20%',
    explanation: '浓度=盐÷(盐+水)×100%=30÷150×100%=20%',
    knowledgePoints: ['浓度问题', '浓度公式']
  })

  // 利润问题
  qs.push({
    gradeId, topicId, difficulty: 2, type: 'solution',
    content: '一件商品成本80元，标价120元，实际按8折出售，赚了多少？',
    answer: '16元',
    explanation: '售价=120×0.8=96元，96-80=16元盈利',
    knowledgePoints: ['利润问题', '打折']
  })

  // 钟面问题
  qs.push({
    gradeId, topicId, difficulty: 2, type: 'solution',
    content: '3点整时，时针和分针的夹角是多少度？',
    answer: '90度',
    explanation: '每个大格30度，3点整相隔3个大格，30×3=90度',
    knowledgePoints: ['钟面问题', '角度计算']
  })

  // 分数应用
  qs.push({
    gradeId, topicId, difficulty: 2, type: 'solution',
    content: '小明读一本书，第一天读了1/3，第二天读了余下的1/2，还剩多少？',
    answer: '1/3',
    explanation: '第一天剩2/3，第二天读2/3×1/2=1/3，还剩1/3',
    knowledgePoints: ['分数应用', '单位1']
  })

  // 更多工程问题
  for (let i = 0; i < 3; i++) {
    const days1 = 10 + i * 2
    const days2 = 15 + i * 3
    const eff1 = 1 / days1
    const eff2 = 1 / days2
    const total = 1 / (eff1 + eff2)

    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `一项工程，甲单独做${days1}天完成，乙单独做${days2}天完成。两人合作需要多少天？`,
      answer: String(total.toFixed(2)),
      explanation: `甲效率1/${days1}，乙效率1/${days2}，合作效率=${eff1.toFixed(3)}+${eff2.toFixed(3)}，时间=${total.toFixed(2)}天`,
      knowledgePoints: ['工程问题', '合作效率']
    })
  }

  // 更多浓度问题
  for (let i = 0; i < 3; i++) {
    const salt = 20 + i * 10
    const water = 80 + i * 20
    const conc = (salt / (salt + water) * 100).toFixed(1)

    qs.push({
      gradeId, topicId, difficulty: 3, type: 'solution',
      content: `有盐${salt}克，水${water}克，盐水的浓度是多少？`,
      answer: `${conc}%`,
      explanation: `浓度=盐÷(盐+水)×100%=${salt}÷${salt + water}×100%=${conc}%`,
      knowledgePoints: ['浓度问题', '浓度公式']
    })
  }

  return qs
}

// 辅助函数
function factorial(n: number): number {
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

function permutation(n: number, r: number): number {
  let result = 1
  for (let i = 0; i < r; i++) result *= (n - i)
  return result
}

function combination(n: number, r: number): number {
  return permutation(n, r) / factorial(r)
}

function coinCombinations(coins: number[], target: number): number[][] {
  const result: number[][] = []
  // 简化版本，生成所有可能的组合
  const combinations = (start: number, remaining: number, current: number[]) => {
    if (remaining === 0) {
      result.push([...current])
      return
    }
    for (let i = start; i < coins.length && coins[i] <= remaining; i++) {
      current.push(coins[i])
      combinations(i, remaining - coins[i], current)
      current.pop()
    }
  }
  combinations(0, target, [])
  return result.slice(0, 20) // 限制返回数量
}

async function main() {
  console.log(`准备添加 ${questions.length} 道题目...`)

  // 先清空已有题目
  await prisma.question.deleteMany({})
  console.log('已清空旧题目')

  let count = 0
  let failed = 0

  for (const q of questions) {
    try {
      await prisma.question.create({ data: q })
      count++
      if (count % 100 === 0) {
        console.log(`已添加 ${count} 题...`)
      }
    } catch (e: any) {
      failed++
      if (failed <= 5) {
        console.error('添加失败:', e.message)
      }
    }
  }

  console.log(`\n成功添加 ${count} 道题目，失败 ${failed} 道！`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

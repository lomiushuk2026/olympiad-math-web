export interface Grade {
  id: number
  name: string
  level: number
  description?: string
  questionCount?: number
}

export interface Topic {
  id: number
  name: string
  parentId?: number
  gradeId: number
  questionCount?: number
  children?: Topic[]
}

export interface Question {
  id: number
  gradeId: number
  topicId: number
  difficulty: number
  type: string
  content: string
  options?: string[]
  answer: string
  explanation: string
  knowledgePoints?: string[]
  source?: string
  topic?: Topic
}

export interface UserQuestionRecord {
  id: number
  userId: number
  questionId: number
  status: 'not_started' | 'learning' | 'mastered' | 'wrong'
  wrongCount: number
  correctCount: number
  consecutiveCorrect: number
  currentInterval: number
  easeFactor: number
  nextReviewAt?: string
  question?: Question
}

export interface UserDailyPractice {
  id: number
  userId: number
  practiceDate: string
  questionIds: number[]
  userAnswers?: string[]
  results?: boolean[]
  difficultyDistribution?: Record<string, number>
  topicCoverage?: number[]
  completed: boolean
  completedAt?: string
  questions?: Question[]
}

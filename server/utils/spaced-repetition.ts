export interface SpacedRepetitionResult {
  newInterval: number
  newEaseFactor: number
  nextReviewAt: Date
}

export function calculateNextReview(
  currentInterval: number,
  easeFactor: number,
  correct: boolean,
  consecutiveCorrect: number
): SpacedRepetitionResult {
  let newInterval: number
  let newEaseFactor = easeFactor

  if (correct) {
    if (consecutiveCorrect === 0) {
      newInterval = 1
    } else if (consecutiveCorrect === 1) {
      newInterval = 3
    } else if (consecutiveCorrect === 2) {
      newInterval = 7
    } else {
      newInterval = Math.min(
        Math.round(currentInterval * easeFactor),
        60
      )
    }
    newEaseFactor = Math.min(easeFactor + 0.1, 3.0)
  } else {
    newInterval = 1
    newEaseFactor = Math.max(easeFactor - 0.2, 1.3)
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)

  return { newInterval, newEaseFactor, nextReviewAt }
}

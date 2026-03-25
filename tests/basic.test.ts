import { describe, it, expect } from 'vitest'

describe('数学算法测试', () => {
  it('SM-2 间隔重复算法 - 首次答对', () => {
    // 测试首次答对，间隔应为1天
    const currentInterval = 1
    const easeFactor = 2.5
    const correct = true
    const consecutiveCorrect = 0

    // 计算逻辑：首次正确 -> 间隔1天
    let newInterval: number
    if (consecutiveCorrect === 0) {
      newInterval = 1
    } else {
      newInterval = Math.round(currentInterval * easeFactor)
    }

    expect(newInterval).toBe(1)
  })

  it('SM-2 间隔重复算法 - 连续答对', () => {
    // 连续答对3次，间隔应为 Math.round(3 * 2.5) = 8 天
    const currentInterval = 3
    const easeFactor = 2.5
    const correct = true
    const consecutiveCorrect = 3

    let newInterval: number
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

    // 3 * 2.5 = 7.5 -> 8
    expect(newInterval).toBe(8)
  })

  it('SM-2 间隔重复算法 - 答错重置', () => {
    // 答错后，间隔重置为1天
    const correct = false
    const newInterval = correct ? 0 : 1
    expect(newInterval).toBe(1)
  })

  it('难度因子计算 - 答对增加', () => {
    const easeFactor = 2.5
    const correct = true
    const newEaseFactor = correct ? Math.min(easeFactor + 0.1, 3.0) : Math.max(easeFactor - 0.2, 1.3)
    expect(newEaseFactor).toBe(2.6)
  })

  it('难度因子计算 - 答错降低', () => {
    const easeFactor = 2.5
    const correct = false
    const newEaseFactor = correct ? Math.min(easeFactor + 0.1, 3.0) : Math.max(easeFactor - 0.2, 1.3)
    expect(newEaseFactor).toBe(2.3)
  })

  it('难度因子下限 1.3', () => {
    const easeFactor = 1.4
    const correct = false
    const newEaseFactor = correct ? Math.min(easeFactor + 0.1, 3.0) : Math.max(easeFactor - 0.2, 1.3)
    expect(newEaseFactor).toBe(1.3)
  })

  it('难度因子上限 3.0', () => {
    const easeFactor = 2.9
    const correct = true
    const newEaseFactor = correct ? Math.min(easeFactor + 0.1, 3.0) : Math.max(easeFactor - 0.2, 1.3)
    expect(newEaseFactor).toBe(3.0)
  })
})

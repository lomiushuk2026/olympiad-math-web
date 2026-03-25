import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('奥数题库功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
  })

  test('首页加载成功', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('小学奥数题库')
  })

  test('年级列表显示', async ({ page }) => {
    // 等待年级卡片加载
    await page.waitForSelector('.bg-white.rounded-lg')
    const gradeCards = page.locator('.bg-white.rounded-lg')
    await expect(gradeCards.first()).toBeVisible()
  })

  test('点击年级展开专题列表', async ({ page }) => {
    // 点击第一个年级
    await page.locator('.bg-white.rounded-lg').first().click()
    // 应该出现专题列表
    await expect(page.locator('text=选择专题')).toBeVisible()
  })

  test('导航栏切换', async ({ page }) => {
    // 测试每日一练导航
    await page.locator('text=每日一练').click()
    await expect(page.locator('h1')).toContainText('每日一练')

    // 测试错题本导航
    await page.locator('text=错题本').click()
    await expect(page.locator('h1')).toContainText('错题本')
  })
})

test.describe('API 接口测试', () => {
  test('获取年级列表 API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/grades`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('获取题目列表 API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/practice/questions?gradeId=38&limit=3`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeLessThanOrEqual(3)
  })

  test('获取每日一练 API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/practice/daily`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('questionIds')
    expect(data).toHaveProperty('practiceDate')
  })

  test('提交答案 API', async ({ request }) => {
    // 先获取一道题目
    const questionsRes = await request.get(`${BASE_URL}/api/practice/questions?gradeId=38&limit=1`)
    const questions = await questionsRes.json()

    if (questions.length > 0) {
      const response = await request.post(`${BASE_URL}/api/practice/answer`, {
        data: {
          questionId: questions[0].id,
          answer: questions[0].answer // 提交正确答案
        }
      })
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data).toHaveProperty('correct')
    }
  })

  test('错题本 API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/practice/wrong-book`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })
})

import { ref, computed } from 'vue'

const STORAGE_KEY = 'hnix_question_history'

const readStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const history = ref(readStorage())

export const useQuestionHistory = () => {
  const recordQuestion = (text, category = '') => {
    if (!text?.trim()) return
    const list = readStorage()
    const existing = list.find(q => q.text === text.trim())
    if (existing) {
      existing.count++
      existing.lastAsked = Date.now()
      existing.category = category || existing.category
    } else {
      list.push({ text: text.trim(), category, count: 1, lastAsked: Date.now() })
    }
    // 최대 200개 보관, 카운트 내림차순 정렬
    const trimmed = list.sort((a, b) => b.count - a.count).slice(0, 200)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    history.value = trimmed
  }

  const top5 = computed(() =>
    [...history.value].sort((a, b) => b.count - a.count).slice(0, 5)
  )

  const refresh = () => {
    history.value = readStorage()
  }

  return { top5, recordQuestion, refresh }
}

import axios from 'axios'

const API_BASE = import.meta.env.VITE_APP_API_BASE

/**
 * 대화 내용을 서버에 저장
 * @param {string} email   - 로그인 사용자 이메일
 * @param {string} query   - 사용자 질문
 * @param {string} answer  - AI 답변
 * @param {string} sessionId - 세션 ID
 */
const saveHistoryWebhook = async (email, query, answer, sessionId) => {
  await axios.post(`${API_BASE}/lab1/api/users/history`, {
    email,
    query,
    answer,
    sessionId,
  })
}

export default saveHistoryWebhook

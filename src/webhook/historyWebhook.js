import axios from 'axios'

const API_BASE = import.meta.env.VITE_APP_API_BASE

const historyWebhook = async (email) => {
  const res = await axios.post(`${API_BASE}/lab1/api/users/history/list`, { email })
  const raw = res.data
  // 응답 형태 유연하게 처리: { status, data } 또는 배열 직접 반환
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : null)
  if (!list) throw new Error('히스토리를 불러오지 못했습니다.')
  return list
}

export default historyWebhook

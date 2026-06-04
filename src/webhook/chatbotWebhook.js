import axios from 'axios'
import { randomBytes } from 'crypto'

const WEBHOOK_URL = import.meta.env.VITE_APP_WEBHOOK_CHAT

const chatbotWebhook = async (message, customSessionId = null, className = null) => {
  try {
    const sessionId = customSessionId || 'user_' + randomBytes(8).toString('hex')

    if (className) {
      message = `[${className}] 테이블에서 검색 후 답변해줘. 질문 : "${message}"`
    }

    const res = await axios.post(
      WEBHOOK_URL,
      {
        message,
        sessionId,
        cls: className,
        tenant: 'user'
      },
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (!res.data || !res.data.answer) {
      throw new Error('답변을 받지 못했습니다.')
    }

    const rawSources = res.data.sources || res.data.files || []
    return {
      answer: res.data.answer,
      sources: rawSources.map(src => typeof src === 'object' ? src : { fileName: src }),
      supplementalContext: res.data.supplementalContext || []
    }
  } catch (error) {
    console.error('Webhook error occurred: ' + error.message)
    throw error
  }
}

export default chatbotWebhook

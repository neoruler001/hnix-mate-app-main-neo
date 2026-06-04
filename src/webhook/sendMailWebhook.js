import axios from 'axios'

const WEBHOOK_URL = import.meta.env.VITE_APP_WEBHOOK_EMAIL

const sendMailWebhook = async (message) => {
  try {
    const sessionId = 'email_' + Math.random().toString(36).substring(2, 9)

    const res = await axios.post(
      WEBHOOK_URL,
      { message, sessionId },
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (!res.data || !res.data.answer) {
      throw new Error('답변을 받지 못했습니다.')
    }

    return res.data.answer
  } catch (error) {
    console.error('SendMail Webhook error: ' + error.message)
    throw error
  }
}

export default sendMailWebhook

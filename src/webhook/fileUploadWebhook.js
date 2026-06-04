import axios from 'axios'

const WEBHOOK_URL = import.meta.env.VITE_APP_WEBHOOK_FILE_UPLOAD

const fileUploadWebhook = async (file) => {
  try {
    const formData = new FormData()
    formData.append('data', file)

    const res = await axios.post(WEBHOOK_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return res.data
  } catch (error) {
    console.error('File Upload Webhook error: ' + error.message)
    throw error
  }
}

export default fileUploadWebhook

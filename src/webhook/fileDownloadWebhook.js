import axios from 'axios'

const WEBHOOK_URL = import.meta.env.VITE_APP_WEBHOOK_FILE_DOWNLOAD

const fileDownloadWebhook = async (fileName) => {
  try {
    const res = await axios.get(WEBHOOK_URL, {
      params: { fileName },
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    const status = err.response?.status
    if (status === 404) {
      throw new Error(`"${fileName}" 파일이 서버에 없습니다. 파일을 다시 업로드해 주세요.`)
    }
    throw new Error(`"${fileName}" 다운로드 중 오류가 발생했습니다. (${status ?? '연결 실패'})`)
  }
}

export default fileDownloadWebhook

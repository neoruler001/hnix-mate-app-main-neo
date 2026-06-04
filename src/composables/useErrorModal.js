import { ref } from 'vue'

// 전역 에러 모달 상태
const isVisible = ref(false)
const errorTitle = ref('오류 발생')
const errorMessage = ref('요청을 처리하는 중 문제가 발생했습니다.')
const errorDetails = ref(null)
const showRetry = ref(false)
const retryCallback = ref(null)

export function useErrorModal() {
    /**
     * 에러 모달 표시
     * @param {Object} options - 에러 모달 옵션
     * @param {string} options.title - 에러 제목
     * @param {string} options.message - 에러 메시지
     * @param {string} options.details - 에러 상세 정보 (선택)
     * @param {boolean} options.retry - 재시도 버튼 표시 여부 (선택)
     * @param {Function} options.onRetry - 재시도 콜백 함수 (선택)
     */
    const showError = (options = {}) => {
        errorTitle.value = options.title || '오류 발생'
        errorMessage.value = options.message || '요청을 처리하는 중 문제가 발생했습니다.'
        errorDetails.value = options.details || null
        showRetry.value = options.retry || false
        retryCallback.value = options.onRetry || null
        isVisible.value = true
    }

    /**
     * 에러 모달 숨김
     */
    const hideError = () => {
        isVisible.value = false
        // 모달이 완전히 사라진 후 상태 초기화
        setTimeout(() => {
            errorTitle.value = '오류 발생'
            errorMessage.value = '요청을 처리하는 중 문제가 발생했습니다.'
            errorDetails.value = null
            showRetry.value = false
            retryCallback.value = null
        }, 300)
    }

    /**
     * 재시도 핸들러
     */
    const handleRetry = () => {
        if (retryCallback.value && typeof retryCallback.value === 'function') {
            retryCallback.value()
        }
        hideError()
    }

    return {
        // 상태
        isVisible,
        errorTitle,
        errorMessage,
        errorDetails,
        showRetry,

        // 메서드
        showError,
        hideError,
        handleRetry
    }
}

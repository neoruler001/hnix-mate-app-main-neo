<template>
  <Teleport to="body">
    <div 
      class="modal fade" 
      :class="{ 'show': isVisible }" 
      :style="{ display: isVisible ? 'block' : 'none' }"
      tabindex="-1" 
      role="dialog"
      aria-labelledby="errorModalLabel"
      @click.self="handleClose"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title d-flex align-items-center" id="errorModalLabel">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              {{ errorTitle }}
            </h5>
            <button 
              type="button" 
              class="btn-close btn-close-white" 
              @click="handleClose"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">{{ errorMessage }}</p>
            <div v-if="errorDetails" class="mt-3">
              <details class="error-details">
                <summary class="text-muted small" role="button">상세 정보 보기</summary>
                <pre class="mt-2 p-2 bg-light rounded small">{{ errorDetails }}</pre>
              </details>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              v-if="showRetry" 
              type="button" 
              class="btn btn-primary" 
              @click="handleRetry"
            >
              <i class="bi bi-arrow-clockwise me-1"></i>
              재시도
            </button>
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="handleClose"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Backdrop -->
    <div 
      v-if="isVisible" 
      class="modal-backdrop fade show"
      @click="handleClose"
    ></div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  errorTitle: {
    type: String,
    default: '오류 발생'
  },
  errorMessage: {
    type: String,
    default: '요청을 처리하는 중 문제가 발생했습니다.'
  },
  errorDetails: {
    type: String,
    default: null
  },
  showRetry: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'retry'])

const handleClose = () => {
  emit('close')
}

const handleRetry = () => {
  emit('retry')
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal.show {
  animation: fadeIn 0.3s ease-in;
}

.modal-dialog {
  animation: slideDown 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.error-details summary {
  cursor: pointer;
  user-select: none;
}

.error-details summary:hover {
  text-decoration: underline;
}

.error-details pre {
  max-height: 200px;
  overflow-y: auto;
  font-size: 0.85rem;
  margin-bottom: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Bootstrap 모달 백드롭 스타일 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: #000;
}

.modal-backdrop.show {
  opacity: 0.5;
}

/* 모달이 표시될 때 z-index 설정 */
.modal {
  z-index: 1050;
}
</style>

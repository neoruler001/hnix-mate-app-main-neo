<template>
  <Teleport to="body">
    <div 
      class="modal fade" 
      :class="{ 'show': isVisible }" 
      :style="{ display: isVisible ? 'block' : 'none' }"
      tabindex="-1" 
      role="dialog"
      aria-labelledby="emailModalLabel"
      @click.self="handleClose"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content glass-modal">
          <div class="modal-header border-0 bg-primary-ci text-white">
            <h5 class="modal-title d-flex align-items-center" id="emailModalLabel">
              <i class="bi bi-envelope-paper-fill me-2"></i>
              답변 메일로 보내기
            </h5>
            <button 
              type="button" 
              class="btn-close btn-close-white" 
              @click="handleClose"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body p-4">
            <!-- Email Input Group -->
            <label class="form-label fw-bold text-primary-ci mb-2">수신자 추가</label>
            <div class="input-group mb-3 glass-input-group">
              <input
                type="email"
                class="form-control border-0 px-3"
                placeholder="이메일 주소를 입력하세요"
                v-model="emailInput"
                @keyup.enter="addEmail"
              />
              <button class="btn btn-primary bg-primary-ci border-0 px-4" type="button" @click="addEmail">
                <i class="bi bi-plus-lg me-1"></i> 추가
              </button>
            </div>

            <!-- Email List -->
            <div class="email-list-container mb-4">
              <label class="form-label small text-muted mb-2">수신자 목록 ({{ recipients.length }}명)</label>
              <div v-if="recipients.length === 0" class="empty-list p-3 text-center rounded border border-dashed border-secondary opacity-50">
                <small>수신자를 추가해주세요.</small>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <span 
                  v-for="(email, index) in recipients" 
                  :key="index" 
                  class="badge recipient-badge d-flex align-items-center p-2 px-3 rounded-pill"
                >
                  {{ email }}
                  <i class="bi bi-x-circle-fill ms-2 cursor-pointer remove-btn" @click="removeEmail(index)"></i>
                </span>
              </div>
            </div>

            <!-- Preview (Optional) -->
            <div class="preview-area p-3 rounded bg-light border">
              <div class="small fw-bold mb-1">전송 내용 미리보기</div>
              <div class="small text-muted text-truncate">
                {{ botMessageText }}
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <button 
              type="button" 
              class="btn btn-secondary rounded-pill px-4" 
              @click="handleClose"
              :disabled="isSending"
            >
              취소
            </button>
            <button 
              type="button" 
              class="btn btn-primary bg-primary-ci border-0 rounded-pill px-4" 
              @click="handleSend"
              :disabled="recipients.length === 0 || isSending"
            >
              <span v-if="isSending" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-send-fill me-2"></i>
              전송하기
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
import { ref, watch } from 'vue'
import sendMailWebhook from '../../webhook/sendMailWebhook'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  botMessageText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'success', 'error'])

const emailInput = ref('')
const recipients = ref([])
const isSending = ref(false)

const addEmail = () => {
  const email = emailInput.value.trim()
  if (!email) return
  
  // 간단한 이메일 유효성 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    alert('유효한 이메일 주소를 입력해주세요.')
    return
  }

  if (recipients.value.includes(email)) {
    alert('이미 추가된 이메일입니다.')
    return
  }

  recipients.value.push(email)
  emailInput.value = ''
}

const removeEmail = (index) => {
  recipients.value.splice(index, 1)
}

const handleClose = () => {
  if (isSending.value) return
  emit('close')
}

const handleSend = async () => {
  if (recipients.value.length === 0) return

  isSending.value = true
  
  try {
    const recipientsStr = recipients.value.join(', ')
    const subject = 'Send Mail by HNIX AI assistant'
    const content = props.botMessageText
    
    // 요구사항 포맷: '받는 사람: {list}, 제목: {subject}, 내용: {content}'
    const formattedMessage = `받는 사람: ${recipientsStr}, 제목: ${subject}, 내용: ${content}`
    
    await sendMailWebhook(formattedMessage)
    
    alert('메일이 성공적으로 전송되었습니다.')
    recipients.value = []
    emit('success')
  } catch (error) {
    console.error('Email send failed:', error)
    alert('메일 전송 중 오류가 발생했습니다.')
    emit('error', error)
  } finally {
    isSending.value = false
  }
}

// 모달이 닫힐 때 초기화
watch(() => props.isVisible, (newVal) => {
  if (!newVal) {
    emailInput.value = ''
    recipients.value = []
  }
})
</script>

<style scoped>
.glass-modal {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
}

.glass-input-group {
  border: 1px solid rgba(25, 58, 148, 0.2);
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.form-control:focus {
  box-shadow: none;
  background: white;
}

.email-list-container {
  min-height: 80px;
}

.recipient-badge {
  background-color: rgba(25, 58, 148, 0.1);
  color: var(--ci-primary);
  font-weight: 500;
  border: 1px solid rgba(25, 58, 148, 0.2);
}

.remove-btn {
  opacity: 0.6;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 1;
  color: var(--bs-danger);
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.cursor-pointer {
  cursor: pointer;
}

.border-dashed {
  border-style: dashed !important;
}
</style>

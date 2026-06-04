<template>
  <div class="upload-container d-flex flex-column h-100 position-relative overflow-hidden">
    
    <!-- 메인화면과 동일한 파스텔 미널 그라데이션 배경 (HomeView와 완전 일치) -->
    <div class="animated-background">
      <i class="bi bi-chat-heart floating-icon icon-1"></i>
      <i class="bi bi-journal-check floating-icon icon-2"></i>
      <i class="bi bi-lightning-charge floating-icon icon-3"></i>
      <i class="bi bi-patch-question floating-icon icon-4"></i>
      <i class="bi bi-node-plus floating-icon icon-5"></i>
      <i class="bi bi-shield-lock floating-icon icon-6"></i>
      <i class="bi bi-database-check floating-icon icon-7"></i>
      <i class="bi bi-stars floating-icon icon-8"></i>
      <i class="bi bi-flower1 floating-icon icon-9"></i>
      <i class="bi bi-hand-thumbs-up floating-icon icon-10"></i>
      <i class="bi bi-buildings floating-icon icon-11"></i>
      <i class="bi bi-clock-history floating-icon icon-12"></i>
      <i class="bi bi-award floating-icon icon-13"></i>
      <i class="bi bi-bar-chart-line floating-icon icon-14"></i>
      <i class="bi bi-briefcase floating-icon icon-15"></i>
      <i class="bi bi-calendar2-check floating-icon icon-16"></i>
      <i class="bi bi-card-checklist floating-icon icon-17"></i>
      <i class="bi bi-cash-coin floating-icon icon-18"></i>
      <i class="bi bi-diagram-2 floating-icon icon-19"></i>
      <i class="bi bi-headset floating-icon icon-20"></i>
    </div>

    <!-- 고정 상단 네비게이션 -->
    <header class="page-topbar d-flex justify-content-between align-items-center px-4 py-3 border-bottom" style="z-index: 10;">
      <div class="d-flex align-items-center gap-2 logo-home" @click="router.push('/')" role="button" title="홈으로">
        <img src="/HNIX-CI.png" alt="HNIX" style="height: 22px;" />
        <span class="fw-bold text-primary-ci fs-5">지식 학습</span>
      </div>
    </header>

    <!-- Main Card Content -->
    <div class="d-flex align-items-center justify-content-center flex-grow-1 p-4" style="z-index: 2; overflow-y: auto;">
      <div class="card shadow-lg border-0 w-100 glass-card" style="max-width: 800px; border-radius: 20px;">
        <div class="card-header bg-transparent border-bottom border-light p-4">
          <h4 class="mb-0 fw-bold text-primary-ci">
            <i class="bi bi-cloud-upload me-2"></i> 지식 학습 파일 업로드
          </h4>
        </div>
        
        <div class="card-body p-5">
          <!-- 문서 카테고리 선택 영역 (주석 처리 - 필요 시 해제 가능)
          <div class="mb-4">
            <label class="form-label fw-bold text-dark opacity-75">분류 선택</label>
            <select class="form-select form-select-lg w-50" v-model="selectedCategory">
              <option value="General">일반</option>
              <option value="Resource">자료실</option>
              <option value="Company">사내소식</option>
              <option value="Mutual_aid">상조</option>
              <option value="Welfare_Doc">사내규정</option>
            </select>
          </div>
          
          <label class="form-label fw-bold text-dark opacity-75 mt-2">학습할 파일 선택</label>
          -->
          <div 
            class="upload-dropzone border-2 border-dashed rounded p-5 text-center mb-4"
            @dragover.prevent
            @drop.prevent="handleDrop"
            :class="{ 'bg-light': !isDragging, 'bg-info bg-opacity-10': isDragging }"
            @dragenter="isDragging = true"
            @dragleave="isDragging = false"
          >
            <i class="bi bi-file-earmark-arrow-up fs-1 text-primary-ci mb-3 d-block"></i>
            <h5 class="fw-bold">이곳에 파일을 드래그하거나 클릭하여 업로드하세요.</h5>
            <p class="text-muted">지원 형식: PDF, Word, PPT, JPG, PNG, JPEG, TXT, MD (최대 30MB)</p>
            <input type="file" ref="fileInput" class="d-none" multiple @change="handleFileSelect" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.jpeg,.txt,.md" />
            <button class="btn btn-primary bg-primary-ci border-0 mt-3" @click="$refs.fileInput.click()">
              파일 선택
            </button>
          </div>

          <div v-if="files.length > 0">
            <h6 class="fw-bold mb-3">업로드 대기 목록 ({{ files.length }})</h6>
            <ul class="list-group list-group-flush mb-4">
              <li v-for="(file, index) in files" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <i class="bi bi-file-earmark me-2 text-secondary"></i>
                  {{ file.name }}
                  <span class="text-muted ms-2 small">({{ formatSize(file.size) }})</span>
                </div>
                <button class="btn btn-sm btn-link text-danger text-decoration-none" @click="removeFile(index)">
                  <i class="bi bi-trash"></i>
                </button>
              </li>
            </ul>
            
            <div class="d-grid">
              <button class="btn btn-success bg-secondary-ci border-0 py-2" @click="uploadFiles" :disabled="isUploading">
                <span v-if="isUploading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isUploading ? '업로드 중...' : '학습 시작하기' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay d-flex align-items-center justify-content-center">
      <div class="card shadow-lg border-0 modal-card text-center p-4">
        <div class="card-body">
          <i class="bi bi-check-circle-fill text-success" style="font-size: 3.5rem;"></i>
          <h4 class="mt-4 fw-bold">업로드 완료</h4>
          <p class="text-muted mt-2">학습 파일이 성공적으로 업로드되었습니다.</p>
          <div class="d-flex justify-content-center gap-3 mt-4 pt-2">
            <button class="btn btn-outline-secondary px-4 rounded-pill fw-bold" @click="showSuccessModal = false">닫기</button>
            <button class="btn btn-primary bg-primary-ci border-0 px-4 rounded-pill fw-bold" @click="router.push('/')">메인화면으로</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import fileUploadWebhook from '../webhook/fileUploadWebhook'
import { useErrorModal } from '../composables/useErrorModal'

const router = useRouter()

const { showError } = useErrorModal()
const isDragging = ref(false)
const files = ref([])
const isUploading = ref(false)
const selectedCategory = ref('General')
const showSuccessModal = ref(false)

const handleDrop = (e) => {
  isDragging.value = false
  const droppedFiles = Array.from(e.dataTransfer.files)
  processFiles(droppedFiles)
}

const handleFileSelect = (e) => {
  const selectedFiles = Array.from(e.target.files)
  processFiles(selectedFiles)
}

const processFiles = (newFiles) => {
  const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png', 'jpeg', 'txt', 'md'] // 'xlsx'
  const maxSize = 30 * 1024 * 1024 // 30MB
  
  const validFiles = []
  const invalidFiles = []

  newFiles.forEach(file => {
    const extension = file.name.split('.').pop().toLowerCase()
    const isValidType = allowedExtensions.includes(extension)
    const isValidSize = file.size <= maxSize

    if (isValidType && isValidSize) {
      validFiles.push(file)
    } else {
      let reason = !isValidType ? '지원하지 않는 형식' : '용량 초과(30MB)'
      invalidFiles.push(`${file.name} (${reason})`)
    }
  })

  if (invalidFiles.length > 0) {
    showError({
      title: '일부 파일 업로드 제외',
      message: `다음 파일들은 요구사항을 충족하지 않아 제외되었습니다:\n${invalidFiles.join('\n')}`,
      retry: false
    })
  }

  files.value = [...files.value, ...validFiles]
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const uploadFiles = async () => {
  if (files.value.length === 0) return
  
  isUploading.value = true
  
  try {
    const uploadPromises = files.value.map(file => fileUploadWebhook(file, selectedCategory.value))
    await Promise.all(uploadPromises)
    
    showSuccessModal.value = true
    
    // 고도화 시, 사용자 카테고리 선택 기능 추가
    // alert(`${files.value.length}개의 파일이 성공적으로 '${selectedCategory.value}' 분류로 업로드되었습니다.`)
    files.value = []
  } catch (error) {
    console.error('Upload failed:', error)
    
    let errorMessage = '파일 업로드 중 오류가 발생했습니다.'
    if (error.response) {
      errorMessage = `서버 오류 (${error.response.status}): 업로드에 실패했습니다.`
    } else if (error.request) {
      errorMessage = '서버와 통신할 수 없습니다. 네트워크 상태를 확인해주세요.'
    }
    
    showError({
      title: '업로드 실패',
      message: errorMessage,
      retry: true,
      onRetry: () => uploadFiles()
    })
  } finally {
    isUploading.value = false
  }
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.page-topbar {
  background: var(--modal-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px var(--shadow-subtle);
}

.logo-home {
  cursor: pointer;
  transition: opacity 0.2s;
}

.logo-home:hover {
  opacity: 0.75;
}

.home-btn {
  border: 1.5px solid var(--ci-primary);
  color: var(--ci-primary);
  font-weight: 600;
  background: var(--item-bg-soft);
  transition: all 0.2s ease;
}

.home-btn:hover {
  background: var(--ci-primary);
  color: white;
}

.upload-dropzone {
  border-color: var(--sidebar-border);
  cursor: pointer;
  background-color: var(--glass-bg);
  transition: all 0.2s;
  backdrop-filter: blur(5px);
}
.upload-dropzone:hover {
  border-color: var(--ci-primary);
  background-color: var(--item-bg-soft);
}

.glass-card {
  background: var(--modal-bg) !important;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

/* Modal Styles */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--shadow-medium);
  z-index: 1050;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-card {
  width: 90%;
  max-width: 400px;
  border-radius: 20px;
  animation: modalFadeIn 0.3s ease-out forwards;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 동적 배경 애니메이션 관련 (HomeView와 동일한 위치/구조 지원) */
.animated-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  /* HomeView.vue와 동일한 파스텔 미널 그라데이션 */
  background: linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-via) 33%, var(--gradient-to) 66%, var(--gradient-from) 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.floating-icon {
  position: absolute;
  font-size: 2rem;
  color: var(--ci-primary); /* 녹색 */
  opacity: 0.15;
  animation: float 20s infinite ease-in-out;
  will-change: transform, opacity;
}

.floating-icon:nth-child(even) {
  color: var(--ci-secondary); /* 파란색 */
  opacity: 0.12;
}

.icon-1 { top: 10%; left: 10%; font-size: 3rem; animation-duration: 18s; animation-delay: 0s; }
.icon-2 { top: 20%; right: 15%; font-size: 2.5rem; animation-duration: 22s; animation-delay: 2s; }
.icon-3 { top: 60%; left: 8%; font-size: 2.8rem; animation-duration: 20s; animation-delay: 4s; }
.icon-4 { top: 70%; right: 10%; font-size: 2.2rem; animation-duration: 19s; animation-delay: 1s; }
.icon-5 { top: 40%; left: 20%; font-size: 2.6rem; animation-duration: 21s; animation-delay: 3s; }
.icon-6 { top: 15%; left: 50%; font-size: 2.4rem; animation-duration: 23s; animation-delay: 5s; }
.icon-7 { top: 80%; left: 30%; font-size: 2.7rem; animation-duration: 17s; animation-delay: 2.5s; }
.icon-8 { top: 50%; right: 25%; font-size: 2.3rem; animation-duration: 24s; animation-delay: 1.5s; }
.icon-9 { top: 30%; right: 5%; font-size: 2.9rem; animation-duration: 19s; animation-delay: 4.5s; }
.icon-10 { top: 85%; right: 40%; font-size: 2.5rem; animation-duration: 22s; animation-delay: 3.5s; }
.icon-11 { top: 5%; right: 40%; font-size: 2.2rem; animation-duration: 20s; animation-delay: 1.5s; }
.icon-12 { top: 25%; left: 35%; font-size: 2.7rem; animation-duration: 18s; animation-delay: 0.5s; }
.icon-13 { top: 75%; right: 20%; font-size: 3.1rem; animation-duration: 25s; animation-delay: 2s; }
.icon-14 { top: 45%; right: 45%; font-size: 2.4rem; animation-duration: 21s; animation-delay: 4s; }
.icon-15 { top: 65%; left: 45%; font-size: 2.6rem; animation-duration: 23s; animation-delay: 1s; }
.icon-16 { top: 35%; left: 5%; font-size: 2.3rem; animation-duration: 19s; animation-delay: 3s; }
.icon-17 { top: 90%; left: 15%; font-size: 2.8rem; animation-duration: 24s; animation-delay: 5s; }
.icon-18 { top: 55%; left: 65%; font-size: 2.5rem; animation-duration: 17s; animation-delay: 2.5s; }
.icon-19 { top: 15%; right: 30%; font-size: 2.9rem; animation-duration: 22s; animation-delay: 4.5s; }
.icon-20 { top: 85%; right: 5%; font-size: 2.4rem; animation-duration: 20s; animation-delay: 3.5s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.15; }
  25% { transform: translate(20px, -30px) rotate(5deg); opacity: 0.25; }
  50% { transform: translate(-15px, -50px) rotate(-5deg); opacity: 0.2; }
  75% { transform: translate(25px, -20px) rotate(3deg); opacity: 0.22; }
}
</style>

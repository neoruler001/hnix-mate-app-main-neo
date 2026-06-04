<template>
  <!-- h-100 + min-height: 0 조합으로 부모 flex 영역만 차지, 절대 overflow 안 됨 -->
  <div class="chat-window-container d-flex flex-column position-relative" style="height: 100%; min-height: 0;">
    <!-- Chat Background (동적 애니메이션) -->
    <div class="chat-animated-background" :class="`bg-theme-${currentCategory.toLowerCase()}`">
      <div class="blob-1"></div>
      <div class="blob-2"></div>
      <div class="blob-3"></div>
    </div>

    <!-- Category Selector Bar (상단) 숨김 요청 (주석 처리)
    <div class="category-sticky-bar p-2 bg-white bg-opacity-75 border-bottom d-flex align-items-center gap-2 overflow-auto">
      <div class="category-label small fw-bold text-primary-ci me-2 text-nowrap px-2">
        <i class="bi bi-tags-fill me-1"></i> 카테고리:
      </div>
      <button 
        v-for="cat in allCategories" 
        :key="cat.className"
        class="btn btn-sm rounded-pill px-3 transition-all text-nowrap"
        :class="currentCategory === cat.className ? 'btn-success bg-primary-ci border-0' : 'btn-outline-secondary'"
        @click="$emit('update-category', cat.className)"
      >
        {{ cat.title }}
      </button>
    </div>
    -->

    <!-- Messages Area: flex-grow-1 + min-height: 0 이 핵심 (이 div만 내부 스크롤) -->
    <div class="messages-area p-4 custom-scrollbar" ref="messagesContainer" style="flex: 1 1 0; overflow-y: auto; min-height: 0;">
      <!-- Welcome Message if empty -->
      <div v-if="messages.length === 0" class="empty-chat-state text-center my-auto p-5" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">
        <div class="mb-4">
          <span class="badge rounded-pill bg-white text-primary-ci border border-primary-ci bg-opacity-75 px-3 py-2 fs-6 shadow-sm">
            <i class="bi bi-chat-square-text-fill me-2"></i> 대화 주제: {{ categoryTitle }}
          </span>
        </div>
        <i class="bi bi-hdd-network-fill display-3 text-primary-ci opacity-25"></i>
        <h5 class="mt-3 text-muted">질문을 입력하고 HNIX MATE와 대화를 시작하세요.</h5>
      </div>

      <MessageBubble 
        v-for="(msg, index) in messages" 
        :key="index" 
        :message="msg" 
        @send-email="handleSendEmail"
      />
      
      <!-- Typing Indicator -->
      <div v-if="isTyping" class="message-container d-flex mb-3 justify-content-start">
        <div class="message-bubble p-3 shadow-sm bot-bubble loading-bubble glass-effect">
          <div class="fw-bold mb-1 text-primary-ci">
            <i class="bi bi-robot me-1"></i> 사내 챗봇
          </div>
          <div class="typing-indicator mt-2">
            <span class="dot green"></span>
            <span class="dot green"></span>
            <span class="dot green"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Send Modal -->
    <EmailModal 
      :is-visible="isEmailModalVisible" 
      :bot-message-text="selectedMessageText"
      @close="isEmailModalVisible = false"
      @success="isEmailModalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import MessageBubble from './MessageBubble.vue'
import EmailModal from './EmailModal.vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  isTyping: {
    type: Boolean,
    default: false
  },
  currentCategory: {
    type: String,
    default: ''
  }
})

defineEmits(['update-category'])

const allCategories = [
  { title: 'CEO 메시지', className: 'Ceo_message' },
  { title: '자료실', className: 'Resource' },
  { title: '사내소식', className: 'Company' },
  { title: '상조', className: 'Mutual_aid' },
  { title: '사내규정', className: 'Welfare_Doc' },
  { title: '영수증', className: 'Receipt' },
  { title: '전사지원업무', className: 'Admin_Support' },
  { title: '인사발령', className: 'HR_Order' },
  { title: '사우소식', className: 'Employee_News' },
  { title: '제휴 및 홍보', className: 'Partnership_PR' },
  { title: '솔루션', className: 'Solution' },
  { title: '인재추천', className: 'Talent_Recommendation' },
  { title: '연말정산', className: 'Year_End_Tax' },
  { title: 'AI', className: 'ai' },
  { title: '기타', className: 'Etc' }
]

const categoryTitle = computed(() => {
  const cat = allCategories.find(c => c.className === props.currentCategory)
  return cat ? cat.title : '일반'
})

const messagesContainer = ref(null)
const isEmailModalVisible = ref(false)
const selectedMessageText = ref('')

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleSendEmail = (message) => {
  selectedMessageText.value = message.text
  isEmailModalVisible.value = true
}

watch(() => props.messages.length, scrollToBottom)
watch(() => props.isTyping, scrollToBottom)
</script>

<style scoped>
.chat-window-container {
  background-color: transparent;
  flex: 1 1 0;
  min-height: 0; /* 핵심: 부모 flex 체인에서 shrink가 되도록 */
  overflow: hidden;
}

/* 동적 배경 (카테고리별 틴트만 부여, 메인 애니메이션 배경 투과) */
.chat-animated-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transition: background 1.5s ease;
  overflow: hidden;
  background-color: transparent;
}

/* 카테고리별 배경색 변주 (투명도를 주어 뒤의 애니메이션과 혼합) */
.bg-theme-ceo_message { background-color: rgba(237, 231, 246, 0.4); }
.bg-theme-resource { background-color: rgba(232, 245, 233, 0.4); }
.bg-theme-company { background-color: rgba(224, 242, 241, 0.5); }
.bg-theme-mutual_aid { background-color: rgba(252, 228, 236, 0.3); }
.bg-theme-welfare_doc { background-color: rgba(255, 248, 225, 0.4); }
.bg-theme-receipt { background-color: rgba(255, 243, 224, 0.4); }
.bg-theme-admin_support { background-color: rgba(227, 242, 253, 0.4); }
.bg-theme-hr_order { background-color: rgba(243, 229, 245, 0.4); }
.bg-theme-employee_news { background-color: rgba(225, 245, 254, 0.4); }
.bg-theme-partnership_pr { background-color: rgba(255, 235, 238, 0.3); }
.bg-theme-solution { background-color: rgba(255, 253, 231, 0.4); }
.bg-theme-talent_recommendation { background-color: rgba(232, 234, 246, 0.4); }
.bg-theme-year_end_tax { background-color: rgba(255, 243, 224, 0.4); }
.bg-theme-ai { background-color: rgba(224, 247, 250, 0.5); }
.bg-theme-etc { background-color: rgba(245, 245, 245, 0.4); }

.category-sticky-bar {
  z-index: 10;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.category-sticky-bar::-webkit-scrollbar {
  height: 0;
}

.messages-area {
  z-index: 5;
  /* flex: 1 1 0 + overflow-y: auto 는 인라인 스타일로 설정됨 */
}

.glass-effect {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.bot-bubble {
  background-color: white;
  border-bottom-left-radius: 0;
}

.loading-bubble {
  max-width: fit-content;
}

.typing-indicator .dot.green {
  background-color: var(--ci-primary);
}

.typing-indicator .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  animation: typing 1s infinite;
}

.typing-indicator .dot:nth-child(1) { animation-delay: 0s; }
.typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.transition-all {
  transition: all 0.2s ease;
}

/* Custom Scrollbar for Messages Area */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(19, 156, 69, 0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(19, 156, 69, 0.4); }
</style>

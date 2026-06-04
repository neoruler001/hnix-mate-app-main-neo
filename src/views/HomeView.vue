<template>
  <div class="home-container d-flex h-100" style="max-height: 100vh; overflow: hidden;">

    <!-- 접근 거부 알림 -->
    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="accessDeniedMessage" class="access-denied-toast">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ accessDeniedMessage }}</span>
        </div>
      </Transition>
    </Teleport>

    <!-- 사이드바 컴포넌트 -->
    <AppSidebar
      ref="sidebarRef"
      @login="onLogin"
      @logout="onLogout"
      @history-select="selectHistory"
      @new-chat="resetToHome"
    />


    <!-- ── 콘텐츠 영역 ── -->
    <div class="content-area flex-grow-1 d-flex overflow-hidden position-relative">

      <!-- 동적 배경 -->
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

      <!-- Main Content -->
      <main class="flex-grow-1 d-flex flex-column position-relative" style="z-index: 2;">

        <!-- Welcome Screen -->
        <div v-if="!isChatActive" class="welcome-screen d-flex flex-column align-items-center justify-content-center flex-grow-1 p-4">
          <div class="welcome-ui-wrapper d-flex flex-column align-items-center w-100">
            <div class="text-center mb-5 welcome-content">
              <div class="main-logo-display mb-4">
                <img src="/HNIX-CI.png" alt="HNIX CI Logo" class="welcome-logo" />
              </div>
              <h2 class="fw-bold mb-3 display-4 text-dark-slate">HNIX의 무엇이든 AI에게 물어보세요</h2>
              <p class="fs-5 text-slate-muted fw-medium">사내 지식 기반 AI 어시스턴트가<br>HR, 자료실, 최신 소식에 대해 즉시 답변해 드립니다.</p>
            </div>
            <SearchBar @search="(q) => handleSearch(q, currentCategoryClass)" class="mb-5 px-3" />
            <div class="row g-4 justify-content-center w-100 px-2" style="max-width: 1100px;">
              <div class="col-6 col-md-3" v-for="cat in mainCategories" :key="cat.title">
                <CategoryCard :icon="cat.icon" :title="cat.title" @select="() => handleCategorySelect(cat.title, cat.className)" />
              </div>
            </div>
            <div v-if="top5.length > 0" class="top5-section mt-4 w-100 px-2" style="max-width: 1100px;">
              <div class="top5-card p-3 rounded-3">
                <div class="d-flex align-items-center mb-2 gap-2">
                  <i class="bi bi-bar-chart-line-fill text-primary-ci"></i>
                  <span class="fw-semibold top5-title">자주 묻는 질문 TOP 5</span>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <button v-for="(item, idx) in top5" :key="item.text" class="btn btn-sm top5-item" @click="handleSearch(item.text, item.category)">
                    <span class="top5-rank me-1">{{ idx + 1 }}</span>{{ item.text }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Screen -->
        <div v-else class="chat-screen d-flex flex-column flex-grow-1 overflow-hidden">
          <div class="flex-grow-1 overflow-hidden d-flex flex-column h-100">
            <ChatWindow
              :messages="messages"
              :is-typing="isTyping"
              :current-category="currentCategoryClass"
              @update-category="updateCategory"
              class="flex-grow-1 overflow-hidden"
            />
          </div>
          <div class="chat-footer-logo text-center mb-2 px-3 align-self-center">
            <small class="text-muted" style="font-size: 0.85rem;">Powered by <strong>HNIX AI</strong></small>
          </div>
          <div class="p-3 bg-white bg-opacity-75 border-top search-area-chat d-flex flex-column shrink-0" style="backdrop-filter: blur(10px);">
            <SearchBar @search="(q) => handleSearch(q, currentCategoryClass)" class="mb-2" />
          </div>
        </div>

      </main>

      <!-- Right Sidebar (Documents) -->
      <aside v-if="relatedDocuments.length > 0 && messages.length > 0" class="d-none d-lg-block">
        <DocumentPanel :documents="relatedDocuments" />
      </aside>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SearchBar from '../components/home/SearchBar.vue'
import CategoryCard from '../components/home/CategoryCard.vue'
import ChatWindow from '../components/home/ChatWindow.vue'
import DocumentPanel from '../components/home/DocumentPanel.vue'
import AppSidebar from '../components/common/AppSidebar.vue'
import { useErrorModal } from '../composables/useErrorModal'
import { useQuestionHistory } from '../composables/useQuestionHistory'
import chatbotWebhook from '../webhook/chatbotWebhook.js'
import saveHistoryWebhook from '../webhook/saveHistoryWebhook.js'

const { top5, recordQuestion, refresh: refreshHistory } = useQuestionHistory()

// ── 사이드바 ref ──────────────────────────────────────────────
const sidebarRef = ref(null)

// ── 사용자 세션 (사이드바 이벤트와 동기화) ──────────────────
const currentUser = ref(null)

const onLogin = (user) => { currentUser.value = user }
const onLogout = () => { currentUser.value = null }

// ── 접근 거부 메시지 ─────────────────────────────────────────
const accessDeniedMessage = ref('')
let accessDeniedTimer = null

const showAccessDenied = (msg) => {
  if (accessDeniedTimer) clearTimeout(accessDeniedTimer)
  accessDeniedMessage.value = msg
  accessDeniedTimer = setTimeout(() => { accessDeniedMessage.value = '' }, 5000)
}

onMounted(() => {
  try {
    const stored = localStorage.getItem('hnix_user')
    if (stored) currentUser.value = JSON.parse(stored)
  } catch { currentUser.value = null }

  const deniedMsg = sessionStorage.getItem('accessDeniedMessage')
  if (deniedMsg) {
    showAccessDenied(deniedMsg)
    sessionStorage.removeItem('accessDeniedMessage')
  }

  refreshHistory()
})

const selectHistory = (item) => {
  handleSearch(item.query, '')
}

// 모든 카테고리 정의
const allCategories = [
  { title: 'CEO 메시지', className: 'Ceo_message', icon: 'bi-megaphone' },
  { title: '자료실', className: 'Resource', icon: 'bi-folder2-open' },
  { title: '사내소식', className: 'Company', icon: 'bi-newspaper' },
  { title: '상조', className: 'Mutual_aid', icon: 'bi-heart-fill' },
  { title: '사내규정', className: 'Welfare_Doc', icon: 'bi-journal-text' },
  { title: '영수증', className: 'Receipt', icon: 'bi-receipt' },
  { title: '전사지원업무', className: 'Admin_Support', icon: 'bi-building-gear' },
  { title: '인사발령', className: 'HR_Order', icon: 'bi-person-lines-fill' },
  { title: '사우소식', className: 'Employee_News', icon: 'bi-people' },
  { title: '제휴 및 홍보', className: 'Partnership_PR', icon: 'bi-megaphone-fill' },
  { title: '솔루션', className: 'Solution', icon: 'bi-lightbulb' },
  { title: '인재추천', className: 'Talent_Recommendation', icon: 'bi-person-check' },
  { title: '연말정산', className: 'Year_End_Tax', icon: 'bi-calculator' },
  { title: 'AI', className: 'ai', icon: 'bi-robot' },
  { title: '기타', className: 'Etc', icon: 'bi-three-dots' }
]

// 메인 화면에 노출될 4개 카테고리 (영수증 제거)
const mainCategories = [
  { title: '자료실', className: 'Resource', icon: 'bi-folder2-open' },
  { title: '사내소식', className: 'Company', icon: 'bi-newspaper' },
  { title: '상조', className: 'Mutual_aid', icon: 'bi-heart-fill' },
  { title: '사내규정', className: 'Welfare_Doc', icon: 'bi-journal-text' }
]

const generateSessionId = () => "chat_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7)
const sessionId = ref(generateSessionId())
const messages = ref([])
const isTyping = ref(false)
const isChatActive = ref(false)
const relatedDocuments = ref([])
const currentCategoryClass = ref('')

// 에러 모달 설정
const { showError } = useErrorModal()

// 답변 텍스트에서 연관도 그래프 정보 추출
const parseSupplementalContext = (text) => {
  if (!text) return null

  const supplementalMatch = text.match(/- \[연관 내용\]:([\s\S]*?)(?=\n(?:###|$))/)
  if (!supplementalMatch) {
    console.log('❌ [Parse] "[연관 내용]" 섹션 없음')
    return null
  }

  console.log('✅ [Parse] "[연관 내용]" 섹션 발견')
  const supplementalText = supplementalMatch[1]
  const relatedDocs = []

  // "[출처: 파일명] 내용" 형식으로 파싱
  const docPattern = /\* \[출처: ([^\]]+)\]\s*(.+?)(?=\n\*|\n\n|$)/g
  let match

  while ((match = docPattern.exec(supplementalText)) !== null) {
    console.log('✅ [Parse] 문서 발견:', match[1])
    relatedDocs.push({
      source: match[1].trim(),
      text: match[2].trim()
    })
  }

  console.log('📊 [Parse] 총', relatedDocs.length, '개 문서 파싱 완료')
  return relatedDocs.length > 0 ? relatedDocs : null
}

const handleSearch = async (query, className = '', isHidden = false) => {
  if (!query.trim()) return

  isChatActive.value = true
  
  // 사용자가 입력한 카테고리로 업데이트
  currentCategoryClass.value = className

  // Add user message
  messages.value.push({
    text: query,
    sender: 'user',
    timestamp: new Date(),
    isHidden: isHidden
  })

  // Simulate bot response
  isTyping.value = true

  try {
    const botResponse = await chatbotWebhook(query, sessionId.value, className)

    isTyping.value = false

    recordQuestion(query, className)

    // 연관도 그래프 정보 추출 (응답에서 직접 supplementalContext 가져오기)
    console.log('📦 [Response] Full:', botResponse)
    console.log('📦 [Response] supplementalContext:', botResponse.supplementalContext)
    console.log('📦 [Response] supplementalContext Type:', typeof botResponse.supplementalContext)
    const supplementalContext = botResponse.supplementalContext || parseSupplementalContext(botResponse.answer)
    console.log('🔍 [Supplemental] From Response:', botResponse.supplementalContext)
    console.log('🔍 [Supplemental] Final:', supplementalContext)
    console.log('🔍 [Supplemental] Final Type:', typeof supplementalContext)
    console.log('🔍 [Supplemental] Final Length:', supplementalContext?.length)

    // 봇 응답 추가
    messages.value.push({
      text: botResponse.answer,
      sources: botResponse.sources || [],
      supplementalContext,
      sender: 'bot',
      timestamp: new Date()
    })

    // 로그인 상태일 때 대화 내용 저장 후 사이드바 갱신
    if (currentUser.value?.email) {
      saveHistoryWebhook(currentUser.value.email, query, botResponse.answer, sessionId.value)
        .then(() => sidebarRef.value?.loadHistory())
        .catch(() => {})
    }
  } catch (error) {
    isTyping.value = false
    
    let errorMessage = '챗봇 연동 중 문제가 발생했습니다.'
    let errorDetails = null
    
    if (error.response) {
      errorMessage = `서버 오류가 발생했습니다. (상태 코드: ${error.response.status})`
      errorDetails = error.response.data ? JSON.stringify(error.response.data, null, 2) : null
    } else if (error.request) {
      errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showError({
      title: '챗봇 오류',
      message: errorMessage,
      retry: true,
      onRetry: () => handleSearch(query, className)
    })
  }
}

const handleCategorySelect = (category, className) => {
  currentCategoryClass.value = className
  isChatActive.value = true
}

const updateCategory = (newClass) => {
  currentCategoryClass.value = newClass
}

const resetToHome = () => {
  messages.value = []
  relatedDocuments.value = []
  isTyping.value = false
  isChatActive.value = false
  currentCategoryClass.value = ''
  sessionId.value = generateSessionId()
  if (currentUser.value?.email) sidebarRef.value?.loadHistory()
}
</script>

<style scoped>
.home-container {
  background-color: transparent;
}

.content-area {
  min-width: 0;
}

/* 접근 거부 토스트 */
.access-denied-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 20px var(--shadow-medium);
  white-space: nowrap;
  pointer-events: none;
  background: var(--error-color);
  color: #fff;
}

/* Welcome Screen Animations */
.welcome-screen {
  position: relative;
  animation: fadeIn 0.5s ease-in;
  overflow: hidden;
}

.welcome-content {
  z-index: 10;
}

.welcome-ui-wrapper {
  position: relative;
  z-index: 10;
  max-width: 1200px;
}

.text-dark-slate {
  color: var(--text-primary) !important;
}

.text-slate-muted {
  color: var(--text-secondary) !important;
}

/* 동적 배경 애니메이션 (파스텔 민트/연블루) */
.animated-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  background: linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-via) 33%, var(--gradient-to) 66%, var(--gradient-from) 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
  transition: background 0.8s ease-in-out;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 떠다니는 아이콘 (초록/파랑 조화톤) */
.floating-icon {
  position: absolute;
  font-size: 2rem;
  color: var(--ci-primary); /* 녹색 */
  opacity: 0.15;
  animation: float 20s infinite ease-in-out;
  will-change: transform, opacity;
}

/* 짝수 번째 아이콘은 파란색 계열 적용 */
.floating-icon:nth-child(even) {
  color: var(--ci-secondary); /* 파란색 */
  opacity: 0.12;
}

.welcome-logo {
  height: 70px; /* 기존 80px에서 약간 축소 */
  object-fit: contain;
  filter: drop-shadow(0 2px 10px var(--shadow-accent));
}

.header-logo {
  height: 24px; /* 기존 아이콘 사이즈와 조화 */
  object-fit: contain;
}

/* 아이콘별 위치 설정 (icon-1 ~ icon-20) */
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

.search-area-chat {
  box-shadow: 0 -5px 20px rgba(0,0,0,0.03);
}

/* ── 사이드바 (Claude 스타일) ── */
.app-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--sidebar-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  transition: width 0.26s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 10;
}

.app-sidebar.collapsed { width: 60px; }

/* 브랜드 + 접기 */
.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 10px;
  flex-shrink: 0;
  min-height: 52px;
}

.collapsed-top { justify-content: center; }

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.sidebar-logo { height: 22px; flex-shrink: 0; }

.sidebar-brand-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ci-primary);
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.sidebar-collapse-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.05rem;
  padding: 5px;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}

.sidebar-collapse-btn:hover {
  color: var(--ci-primary);
  background: var(--sidebar-hover-bg);
}

/* 새 채팅 버튼 */
.sidebar-new-chat {
  padding: 6px 10px 6px;
  flex-shrink: 0;
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  color: var(--text-primary);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.new-chat-btn:hover {
  background: var(--sidebar-hover-bg);
  color: var(--ci-primary);
}

.new-chat-btn:hover .new-chat-icon { color: var(--ci-primary); }

.new-chat-icon {
  font-size: 1rem;
  flex-shrink: 0;
  color: var(--sidebar-item-color);
}

.new-chat-label {
  flex: 1;
  text-align: left;
}

.new-chat-shortcut {
  font-size: 0.72rem;
  color: var(--text-muted);
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

/* 접힌 상태: 테두리 제거, 아이콘 중앙 */
.app-sidebar.collapsed .new-chat-btn {
  background: none;
  border-color: transparent;
  justify-content: center;
  padding: 9px;
}

.app-sidebar.collapsed .new-chat-btn:hover {
  background: var(--item-hover-bg);
  border-color: transparent;
}

/* 네비게이션 */
.sidebar-nav {
  padding: 4px 10px 6px;
  flex-shrink: 0;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 0.9rem;
  color: var(--sidebar-item-color);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-align: left;
  transition: background 0.12s, color 0.12s;
}

.sidebar-nav-item:hover {
  background: var(--sidebar-hover-bg);
  color: var(--ci-primary);
}

.sidebar-nav-item:hover i { color: var(--ci-primary); }
.sidebar-nav-item i { font-size: 1rem; flex-shrink: 0; }

/* 섹션 헤더 */
.sidebar-section-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  padding: 10px 18px 4px;
  letter-spacing: 0.01em;
  flex-shrink: 0;
}

/* 기록 목록 */
.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 2px 0 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-bg) transparent;
}

.sidebar-body::-webkit-scrollbar { width: 3px; }
.sidebar-body::-webkit-scrollbar-track { background: transparent; }
.sidebar-body::-webkit-scrollbar-thumb { background: var(--scrollbar-bg); border-radius: 2px; }

.sidebar-spacer { flex: 1; min-height: 8px; }

.sidebar-state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 18px;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.6;
  text-align: center;
}

.sidebar-state-warn { color: #e57373; }
.sidebar-state-muted { color: var(--text-primary); }

.sidebar-group-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  padding: 12px 18px 3px;
  letter-spacing: 0.01em;
}

.sidebar-item {
  display: block;
  width: calc(100% - 16px);
  margin: 1px 8px;
  padding: 6px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  text-align: left;
  font-size: 0.875rem;
  color: var(--sidebar-item-color);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.12s;
  line-height: 1.5;
}

.sidebar-item:hover { background: var(--sidebar-hover-bg); }

/* 하단 */
.sidebar-bottom {
  flex-shrink: 0;
  padding: 10px 10px;
}

.sidebar-divider {
  height: 1px;
  background: var(--sidebar-divider);
  margin: 0 0 10px;
}

/* 사용자 행 */
.sidebar-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: default;
  transition: background 0.12s;
}

.sidebar-user-row:hover { background: none; }

.sidebar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ci-primary);
  color: white;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-user-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.sidebar-user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.sidebar-user-dept {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-logout-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.95rem;
  padding: 4px 5px;
  border-radius: 5px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
}

.sidebar-logout-btn:hover {
  color: var(--ci-primary) !important;
  background: none;
}

/* 로그인/회원가입 모달 */
.auth-tabs {
  border-bottom: 2px solid var(--sidebar-border);
  gap: 0;
}

.auth-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  padding: 8px 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.auth-tab.active {
  color: var(--ci-primary);
  border-bottom-color: var(--ci-primary);
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: var(--shadow-medium);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.login-modal {
  background: var(--modal-bg);
  width: 100%;
  max-width: 400px;
  animation: modalIn 0.25s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.bg-primary-ci-soft { background: var(--item-bg-soft); }

.btn-primary-ci {
  background: var(--ci-primary);
  color: white;
  border: none;
}

.btn-primary-ci:hover {
  background: var(--accent-hover);
  color: white;
}

/* TOP 5 */
.top5-section {
  margin-left: auto;
  margin-right: auto;
}

.top5-card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.top5-title {
  font-size: 0.88rem;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.top5-item {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--item-bg-light);
  border: 1px solid var(--item-border-light);
  border-radius: 20px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s ease;
  text-align: left;
}

.top5-item:hover {
  background: var(--ci-primary);
  border-color: var(--ci-primary);
  color: white;
}

.top5-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ci-primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.top5-item:hover .top5-rank {
  background: white;
  color: var(--ci-primary);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Chat Screen Animations */
.chat-screen {
  animation: slideIn 0.4s ease-out;
  background-color: transparent !important;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ── 토스트 ─────────────────────────────────────────── */
.app-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 20px var(--shadow-medium);
  white-space: nowrap;
  pointer-events: none;
}
.app-toast--success {
  background: var(--success-color);
  color: #fff;
}
.app-toast--error {
  background: var(--error-color);
  color: #fff;
}
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>

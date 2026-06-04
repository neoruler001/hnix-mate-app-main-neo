<template>
  <!-- 토스트 알림 -->
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="toast.show" :class="['app-toast', `app-toast--${toast.type}`]">
        <i :class="['bi', toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill']"></i>
        <span>{{ toast.text }}</span>
      </div>
    </Transition>
  </Teleport>

  <!-- 로그인/회원가입 모달 -->
  <Teleport to="body">
    <div v-if="showLoginModal" class="modal-backdrop-custom" @click.self="closeModal">
      <div class="login-modal p-4 rounded-4 shadow-lg">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2">
            <img src="/HNIX-CI.png" alt="HNIX" style="height:20px;" />
            <span class="fw-bold fs-5" style="color: var(--ci-primary);">HNIX MATE</span>
          </div>
          <button class="btn-close" @click="closeModal"></button>
        </div>

        <div class="auth-tabs d-flex mb-4">
          <button class="auth-tab flex-grow-1" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">
            로그인
          </button>
          <button class="auth-tab flex-grow-1" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">
            회원가입
          </button>
        </div>

        <div v-if="loginAlert.show" :class="`alert alert-${loginAlert.type} py-2 small mb-3`">
          {{ loginAlert.text }}
        </div>

        <form v-if="authMode === 'login'" @submit.prevent="doLogin">
          <div class="mb-3">
            <label class="form-label fw-semibold small">이메일</label>
            <input v-model="loginForm.email" type="email" class="form-control" placeholder="name@company.com" required />
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold small">비밀번호</label>
            <input v-model="loginForm.password" type="password" class="form-control" placeholder="비밀번호 입력" required />
          </div>
          <button type="submit" class="btn-primary-ci w-100 fw-bold" :disabled="loginLoading">
            <span v-if="loginLoading" class="spinner-border spinner-border-sm me-2"></span>
            로그인
          </button>
        </form>

        <form v-else @submit.prevent="doRegister">
          <div class="row g-3 mb-3">
            <div class="col-12">
              <label class="form-label fw-semibold small">이메일 <span class="text-danger">*</span></label>
              <input v-model="registerForm.email" type="email" class="form-control" placeholder="name@company.com" required />
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold small">이름 <span class="text-danger">*</span></label>
              <input v-model="registerForm.name" type="text" class="form-control" placeholder="홍길동" required />
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold small">연락처</label>
              <input v-model="registerForm.phone" type="text" class="form-control" placeholder="010-0000-0000" />
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold small">비밀번호 <span class="text-danger">*</span></label>
              <input v-model="registerForm.password" type="password" class="form-control" placeholder="비밀번호 입력" required />
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold small">비밀번호 확인 <span class="text-danger">*</span></label>
              <input v-model="registerForm.passwordConfirm" type="password" class="form-control"
                :class="registerForm.passwordConfirm && registerForm.password !== registerForm.passwordConfirm ? 'is-invalid' : ''"
                placeholder="비밀번호를 다시 입력하세요" required />
              <div v-if="registerForm.passwordConfirm && registerForm.password !== registerForm.passwordConfirm"
                class="invalid-feedback">비밀번호가 일치하지 않습니다.</div>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold small">소속 팀 <span class="text-danger">*</span></label>
              <select v-model="registerForm.deptId" class="form-select" required>
                <option value="">팀을 선택하세요</option>
                <option v-for="d in departments" :key="d.name" :value="d.id" :disabled="!d.id">
                  {{ d.name }}{{ !d.id ? ' (준비 중)' : '' }}
                </option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn-primary-ci w-100 fw-bold" :disabled="loginLoading">
            <span v-if="loginLoading" class="spinner-border spinner-border-sm me-2"></span>
            회원가입
          </button>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- 왼쪽 사이드바 -->
  <aside class="app-sidebar" :class="{ collapsed: !sidebarOpen }">

    <!-- 브랜드 + 접기 버튼 -->
    <div class="sidebar-top" :class="{ 'collapsed-top': !sidebarOpen }">
      <div v-if="sidebarOpen" class="sidebar-brand" @click="handleHomeClick" role="button" title="홈으로">
        <img src="/HNIX-CI.png" alt="HNIX" class="sidebar-logo" />
        <span class="sidebar-brand-name">HNIX MATE</span>
      </div>
      <button class="sidebar-collapse-btn" @click="sidebarOpen = !sidebarOpen"
        :title="sidebarOpen ? '사이드바 접기' : '사이드바 열기'">
        <i class="bi" :class="sidebarOpen ? 'bi-layout-sidebar' : 'bi-layout-sidebar-reverse'"></i>
      </button>
    </div>

    <!-- 새 채팅 버튼 -->
    <div class="sidebar-new-chat">
      <button class="new-chat-btn" @click="handleHomeClick" :title="!sidebarOpen ? '새 채팅' : ''">
        <i class="bi bi-plus-lg new-chat-icon"></i>
        <span v-if="sidebarOpen" class="new-chat-label">새 채팅</span>
      </button>
    </div>

    <!-- 네비게이션 메뉴 -->
    <nav class="sidebar-nav">
      <button class="sidebar-nav-item" :class="{ 'nav-active': isActive('/upload') }"
        @click="router.push('/upload')" :title="!sidebarOpen ? '지식 학습' : ''">
        <i class="bi bi-cloud-arrow-up-fill"></i>
        <span v-if="sidebarOpen">지식 학습</span>
      </button>
      <button class="sidebar-nav-item" :class="{ 'nav-active': isActive('/hnllm') }"
        @click="router.push('/hnllm')" :title="!sidebarOpen ? 'HN LLM' : ''">
        <i class="bi bi-chat-dots-fill"></i>
        <span v-if="sidebarOpen">HN LLM</span>
      </button>
      <button class="sidebar-nav-item" :class="{ 'nav-active': isActive('/mllm') }"
        @click="router.push('/mllm')" :title="!sidebarOpen ? 'HN MLLM' : ''">
        <i class="bi bi-layout-split"></i>
        <span v-if="sidebarOpen">HN MLLM</span>
      </button>
      <button v-if="currentUser && currentUser.isAdmin" class="sidebar-nav-item"
        :class="{ 'nav-active': isActive('/admin') }"
        @click="router.push('/admin')" :title="!sidebarOpen ? '시스템 관리' : ''">
        <i class="bi bi-shield-lock-fill"></i>
        <span v-if="sidebarOpen">시스템 관리</span>
      </button>
    </nav>

    <!-- 대화 기록 -->
    <template v-if="sidebarOpen">
      <div class="sidebar-section-label">최근 항목</div>
      <div class="sidebar-body">
        <div v-if="historyLoading" class="sidebar-state-msg">
          <div class="spinner-border spinner-border-sm opacity-40"></div>
          <span>불러오는 중...</span>
        </div>
        <div v-else-if="historyError" class="sidebar-state-msg sidebar-state-muted">
          <span>대화 기록을 불러오지 못했습니다.</span>
        </div>
        <div v-else-if="!historyList.length" class="sidebar-state-msg sidebar-state-muted">
          <span>저장된 대화 기록이 없습니다.</span>
        </div>
        <div v-else>
          <div v-for="group in groupedHistory" :key="group.label">
            <div class="sidebar-group-label">{{ group.label }}</div>
            <button
              v-for="item in group.items"
              :key="item.id"
              class="sidebar-item"
              @click="handleHistorySelect(item)"
            >{{ item.query }}</button>
          </div>
        </div>
      </div>
    </template>

    <div class="sidebar-spacer"></div>

    <!-- 하단 사용자 영역 -->
    <div class="sidebar-bottom">
      <div class="sidebar-divider"></div>

      <button class="sidebar-nav-item" @click="toggleTheme" :title="isDark ? '밝게' : '어둡게'">
        <i class="bi" :class="isDark ? 'bi-sun-fill' : 'bi-moon-fill'"></i>
        <span v-if="sidebarOpen">{{ isDark ? '밝게' : '어둡게' }}</span>
      </button>

      <div v-if="currentUser" class="sidebar-user-row" :title="!sidebarOpen ? (currentUser.name || currentUser.email) : ''">
        <div class="sidebar-avatar">{{ (currentUser.name || currentUser.email || '?')[0].toUpperCase() }}</div>
        <div v-if="sidebarOpen" class="sidebar-user-text">
          <span class="sidebar-user-name">{{ currentUser.name || currentUser.email }}</span>
          <span v-if="currentUser.deptName" class="sidebar-user-dept">{{ currentUser.deptName }}</span>
        </div>
        <button v-if="sidebarOpen" class="sidebar-logout-btn" @click="handleLogout" title="로그아웃">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>

      <button v-else class="sidebar-nav-item" @click="openModal" :title="!sidebarOpen ? '로그인' : ''">
        <i class="bi bi-person"></i>
        <span v-if="sidebarOpen">로그인</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import historyWebhook from '../../webhook/historyWebhook.js'

const emit = defineEmits(['login', 'logout', 'history-select', 'new-chat'])
defineExpose({ loadHistory })

const router = useRouter()
const route = useRoute()

const API_BASE = import.meta.env.VITE_APP_API_BASE

// ── 상태 ─────────────────────────────────────────────────────────
const sidebarOpen   = ref(true)
const isDark        = ref(false)
const currentUser   = ref(null)

const historyList    = ref([])
const historyLoading = ref(false)
const historyError   = ref('')

const showLoginModal = ref(false)
const authMode       = ref('login')
const loginLoading   = ref(false)
const loginForm      = ref({ email: '', password: '' })
const registerForm   = ref({ email: '', name: '', phone: '', password: '', passwordConfirm: '', deptId: '' })
const loginAlert     = ref({ show: false, type: 'danger', text: '' })
const departments    = ref([])

const toast      = ref({ show: false, type: 'success', text: '' })
let toastTimer   = null

// ── 테마 ─────────────────────────────────────────────────────────
const applyTheme = (dark) => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  localStorage.setItem('hnix_theme', isDark.value ? 'dark' : 'light')
}

// ── 라우트 헬퍼 ──────────────────────────────────────────────────
const isActive = (path) => route.path === path

// ── 홈/새 채팅 ───────────────────────────────────────────────────
const handleHomeClick = () => {
  if (route.path === '/') {
    emit('new-chat')
  } else {
    router.push('/')
  }
}

// ── 히스토리 선택 ─────────────────────────────────────────────────
const handleHistorySelect = (item) => {
  if (route.path === '/') {
    emit('history-select', item)
  } else {
    router.push('/')
  }
}

// ── 로그아웃 ─────────────────────────────────────────────────────
const handleLogout = () => {
  localStorage.removeItem('hnix_user')
  currentUser.value = null
  historyList.value = []
  emit('logout')
}

// ── 대화 기록 ─────────────────────────────────────────────────────
async function loadHistory() {
  if (!currentUser.value?.email) return
  historyLoading.value = true
  historyError.value = ''
  try {
    historyList.value = await historyWebhook(currentUser.value.email)
  } catch {
    historyError.value = '대화 기록을 불러오지 못했습니다.'
  } finally {
    historyLoading.value = false
  }
}

const groupedHistory = computed(() => {
  if (!historyList.value.length) return []

  const recent = [...historyList.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const now = new Date()
  const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
  const startOfWeek      = new Date(startOfToday.getTime() - 7 * 86400000)
  const groups = { today: [], yesterday: [], week: [], older: [] }

  recent.forEach(item => {
    const d   = new Date(item.createdAt)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (day >= startOfToday)     groups.today.push(item)
    else if (day >= startOfYesterday) groups.yesterday.push(item)
    else if (day >= startOfWeek) groups.week.push(item)
    else                          groups.older.push(item)
  })

  return [
    { label: '오늘',    items: groups.today },
    { label: '어제',    items: groups.yesterday },
    { label: '이번 주', items: groups.week },
    { label: '이전',    items: groups.older },
  ].filter(g => g.items.length > 0)
})

// ── 로그인 모달 ──────────────────────────────────────────────────
const DEPT_FALLBACK = [
  { id: '65afa76a-2876-46b7-a293-8c4b4150d357', name: 'HD현대개발팀' },
  { id: '65d0de11-e641-4a2e-b164-8e18edb30bd4', name: 'HD현대운영팀' },
  { id: '611522e2-63bc-409a-9944-a391af21753b', name: 'HD현대함정,중형선팀' },
  { id: '29b1e57a-4bce-4e67-9c75-33a69d2fed05', name: 'AX추진팀' },
  { id: '855ce555-c32a-4593-91e5-350593895d21', name: 'AX전략팀' },
]

const loadDepartments = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/lab1/api/departments`)
    const list = (Array.isArray(data) ? data : data.data ?? [])
      .map(d => ({ id: d.id ?? d.uuid ?? '', name: d.name ?? d.dept_name ?? d.deptName ?? '' }))
      .filter(d => d.id && d.name)
    departments.value = list.length ? list : DEPT_FALLBACK
  } catch {
    departments.value = DEPT_FALLBACK
  }
}

const showToast = (type, text, duration = 3000) => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, type, text }
  toastTimer = setTimeout(() => { toast.value.show = false }, duration)
}

const showLoginAlert = (type, text) => {
  loginAlert.value = { show: true, type, text }
  setTimeout(() => { loginAlert.value.show = false }, 3000)
}

const openModal = () => {
  showLoginModal.value = true
  loadDepartments()
}

const closeModal = () => {
  showLoginModal.value = false
  loginAlert.value.show = false
  loginForm.value = { email: '', password: '' }
  registerForm.value = { email: '', name: '', phone: '', password: '', passwordConfirm: '', deptId: '' }
}

const doLogin = async () => {
  loginLoading.value = true
  try {
    const { data } = await axios.post(`${API_BASE}/lab1/api/users/detail`, {
      email: loginForm.value.email
    })
    const user = Array.isArray(data) ? data[0] : (data.data ?? data)
    if (!user || !user.email) return showLoginAlert('danger', '등록되지 않은 이메일입니다.')
    if (user.password !== loginForm.value.password) return showLoginAlert('danger', '비밀번호가 일치하지 않습니다.')

    const dept = departments.value.find(d => d.id === (user.deptId ?? user.dept_id ?? user.department_id))
    currentUser.value = {
      email:    user.email,
      name:     user.name,
      deptName: user.deptName ?? user.dept_name ?? dept?.name ?? '',
      isAdmin:  user.isAdmin ?? false
    }
    localStorage.setItem('hnix_user', JSON.stringify(currentUser.value))
    closeModal()
    await loadHistory()
    emit('login', currentUser.value)
  } catch {
    showLoginAlert('danger', '로그인 중 오류가 발생했습니다.')
  } finally {
    loginLoading.value = false
  }
}

const doRegister = async () => {
  const { email, name, phone, password, passwordConfirm, deptId } = registerForm.value
  if (!email || !name || !password || !passwordConfirm || !deptId)
    return showLoginAlert('danger', '필수 항목을 모두 입력해주세요.')
  if (password !== passwordConfirm)
    return showLoginAlert('danger', '비밀번호가 일치하지 않습니다.')

  loginLoading.value = true
  try {
    await axios.post(`${API_BASE}/lab1/api/register`, { email, name, phone, password, deptId })
    closeModal()
    registerForm.value = { email: '', name: '', phone: '', password: '', passwordConfirm: '', deptId: '' }
    showToast('success', '회원가입이 완료되었습니다.')
  } catch (err) {
    const status = err.response?.status
    if (status === 409) {
      showLoginAlert('danger', '이미 회원 가입된 사용자입니다.')
    } else {
      const msg = err.response?.data?.detail ?? err.response?.data?.message ?? '회원가입 중 오류가 발생했습니다.'
      showLoginAlert('danger', msg)
    }
  } finally {
    loginLoading.value = false
  }
}

// ── 초기화 ───────────────────────────────────────────────────────
onMounted(async () => {
  const savedTheme = localStorage.getItem('hnix_theme') || 'light'
  isDark.value = savedTheme === 'dark'
  applyTheme(isDark.value)

  try {
    const stored = localStorage.getItem('hnix_user')
    if (stored) currentUser.value = JSON.parse(stored)
  } catch { currentUser.value = null }

  if (currentUser.value?.email) await loadHistory()
})
</script>

<style scoped>
/* ── 사이드바 ─────────────────────────────────────────────────── */
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

.app-sidebar.collapsed .new-chat-btn {
  background: none;
  justify-content: center;
  padding: 9px;
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

.sidebar-nav-item.nav-active {
  background: var(--sidebar-hover-bg);
  color: var(--ci-primary);
  font-weight: 600;
}

.sidebar-nav-item.nav-active i { color: var(--ci-primary); }

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

.sidebar-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: default;
}

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

/* ── 로그인/회원가입 모달 ─────────────────────────────────────── */
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

.btn-primary-ci {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  background: var(--ci-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary-ci:hover { background: var(--accent-hover); color: white; }
.btn-primary-ci:disabled { opacity: 0.65; cursor: not-allowed; }

/* ── 토스트 ─────────────────────────────────────────────────── */
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

.app-toast--success { background: var(--success-color); color: #fff; }
.app-toast--error   { background: var(--error-color);   color: #fff; }

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

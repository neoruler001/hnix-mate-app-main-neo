<template>
  <div class="mllm-wrap">
    <!-- 배경 floating 아이콘 -->
    <div class="bg-icons" aria-hidden="true">
      <i class="bi bi-cpu float-icon" style="top:8%;left:5%;font-size:2.8rem;animation-delay:0s"></i>
      <i class="bi bi-braces float-icon" style="top:20%;right:8%;font-size:2rem;animation-delay:1.2s"></i>
      <i class="bi bi-lightning-charge float-icon" style="bottom:25%;left:12%;font-size:2.2rem;animation-delay:2.1s"></i>
      <i class="bi bi-stars float-icon" style="bottom:15%;right:15%;font-size:1.8rem;animation-delay:0.8s"></i>
      <i class="bi bi-robot float-icon" style="top:50%;left:3%;font-size:2.5rem;animation-delay:1.7s"></i>
      <i class="bi bi-diagram-3 float-icon" style="top:35%;right:4%;font-size:2rem;animation-delay:0.5s"></i>
    </div>

    <!-- 헤더 -->
    <header class="mllm-header glass-panel">
      <div class="header-left">
        <RouterLink to="/" class="back-btn" title="홈으로">
          <i class="bi bi-arrow-left-short"></i>
        </RouterLink>
        <div class="header-brand">
          <span class="brand-dot"></span>
          <span class="brand-name">HN <span class="brand-accent">MLLM</span></span>
          <span class="brand-sub">멀티 모델 비교</span>
        </div>
      </div>

      <div class="header-center">
        <div class="compare-badge">
          <i class="bi bi-layout-split me-1"></i>
          <span>듀얼 모델 동시 비교</span>
        </div>
      </div>

      <button class="clear-btn" @click="clearAll" title="전체 초기화" :disabled="messagesA.length === 0 && messagesB.length === 0">
        <i class="bi bi-arrow-counterclockwise me-1"></i>초기화
      </button>
    </header>

    <!-- 듀얼 패널 영역 -->
    <div class="dual-panels">

      <!-- 패널 A -->
      <div class="panel panel-a">
        <div class="panel-header glass-panel">
          <div class="panel-label panel-label-a">
            <i class="bi bi-1-circle-fill me-1"></i>모델 A
          </div>
          <div class="custom-select-wrap" :class="{ open: dropdownOpenA }" ref="dropdownRefA">
            <button class="custom-select-btn glass-panel" @click="dropdownOpenA = !dropdownOpenA">
              <span class="selected-model-info" v-if="selectedModelA">
                <span class="model-group-badge" :style="{ background: groupColor(selectedModelA.group) }">
                  {{ selectedModelA.group }}
                </span>
                <span class="selected-model-name">{{ selectedModelA.name }}</span>
              </span>
              <span v-else class="placeholder-text">모델을 선택하세요</span>
              <i class="bi bi-chevron-down chevron-icon" :class="{ rotated: dropdownOpenA }"></i>
            </button>

            <div class="dropdown-panel glass-panel" v-show="dropdownOpenA">
              <div v-for="group in modelGroups" :key="group.name" class="model-group">
                <div class="group-header" :style="{ borderColor: groupColor(group.name) }">
                  <span class="group-dot" :style="{ background: groupColor(group.name) }"></span>
                  {{ group.name }}
                </div>
                <button
                  v-for="m in group.models"
                  :key="m.id"
                  class="model-option"
                  :class="{ active: selectedModelA && selectedModelA.id === m.id }"
                  @click="selectModelA(m)"
                >
                  <i class="bi bi-check2 check-icon" v-if="selectedModelA && selectedModelA.id === m.id"></i>
                  <span>{{ m.name }}</span>
                  <span class="model-id-tag">{{ m.id }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-area" ref="chatAreaRefA">
          <div v-if="messagesA.length === 0" class="empty-state">
            <div class="empty-icon-wrap empty-a">
              <i class="bi bi-robot empty-icon"></i>
            </div>
            <p class="empty-desc">모델 A를 선택하고<br>아래에 질문을 입력하세요</p>
          </div>
          <div v-else class="messages-list">
            <div
              v-for="(msg, idx) in messagesA"
              :key="idx"
              class="msg-row"
              :class="msg.role === 'user' ? 'msg-user' : 'msg-model'"
            >
              <div v-if="msg.role === 'model'" class="avatar avatar-model avatar-a">
                <i class="bi bi-robot"></i>
              </div>
              <div class="bubble-wrap">
                <div v-if="msg.role === 'model'" class="bubble-meta">
                  <span class="model-group-badge sm" :style="{ background: groupColor(msg.modelGroup) }">
                    {{ msg.modelGroup }}
                  </span>
                  <span class="bubble-model-name">{{ msg.modelName }}</span>
                </div>
                <div class="bubble" :class="[msg.role === 'user' ? 'bubble-user' : 'bubble-model', msg.isError ? 'bubble-error' : '']">
                  <div v-if="msg.loading" class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                  <div v-else class="bubble-text" v-html="formatText(msg.content)"></div>
                </div>
                <div class="bubble-time">{{ msg.time }}</div>
              </div>
              <div v-if="msg.role === 'user'" class="avatar avatar-user">
                <i class="bi bi-person-fill"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 구분선 -->
      <div class="panel-divider">
        <div class="divider-vs">VS</div>
      </div>

      <!-- 패널 B -->
      <div class="panel panel-b">
        <div class="panel-header glass-panel">
          <div class="panel-label panel-label-b">
            <i class="bi bi-2-circle-fill me-1"></i>모델 B
          </div>
          <div class="custom-select-wrap" :class="{ open: dropdownOpenB }" ref="dropdownRefB">
            <button class="custom-select-btn glass-panel" @click="dropdownOpenB = !dropdownOpenB">
              <span class="selected-model-info" v-if="selectedModelB">
                <span class="model-group-badge" :style="{ background: groupColor(selectedModelB.group) }">
                  {{ selectedModelB.group }}
                </span>
                <span class="selected-model-name">{{ selectedModelB.name }}</span>
              </span>
              <span v-else class="placeholder-text">모델을 선택하세요</span>
              <i class="bi bi-chevron-down chevron-icon" :class="{ rotated: dropdownOpenB }"></i>
            </button>

            <div class="dropdown-panel glass-panel" v-show="dropdownOpenB">
              <div v-for="group in modelGroups" :key="group.name" class="model-group">
                <div class="group-header" :style="{ borderColor: groupColor(group.name) }">
                  <span class="group-dot" :style="{ background: groupColor(group.name) }"></span>
                  {{ group.name }}
                </div>
                <button
                  v-for="m in group.models"
                  :key="m.id"
                  class="model-option"
                  :class="{ active: selectedModelB && selectedModelB.id === m.id }"
                  @click="selectModelB(m)"
                >
                  <i class="bi bi-check2 check-icon" v-if="selectedModelB && selectedModelB.id === m.id"></i>
                  <span>{{ m.name }}</span>
                  <span class="model-id-tag">{{ m.id }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-area" ref="chatAreaRefB">
          <div v-if="messagesB.length === 0" class="empty-state">
            <div class="empty-icon-wrap empty-b">
              <i class="bi bi-robot empty-icon"></i>
            </div>
            <p class="empty-desc">모델 B를 선택하고<br>아래에 질문을 입력하세요</p>
          </div>
          <div v-else class="messages-list">
            <div
              v-for="(msg, idx) in messagesB"
              :key="idx"
              class="msg-row"
              :class="msg.role === 'user' ? 'msg-user' : 'msg-model'"
            >
              <div v-if="msg.role === 'model'" class="avatar avatar-model avatar-b">
                <i class="bi bi-robot"></i>
              </div>
              <div class="bubble-wrap">
                <div v-if="msg.role === 'model'" class="bubble-meta">
                  <span class="model-group-badge sm" :style="{ background: groupColor(msg.modelGroup) }">
                    {{ msg.modelGroup }}
                  </span>
                  <span class="bubble-model-name">{{ msg.modelName }}</span>
                </div>
                <div class="bubble" :class="[msg.role === 'user' ? 'bubble-user' : 'bubble-model', msg.isError ? 'bubble-error' : '']">
                  <div v-if="msg.loading" class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                  <div v-else class="bubble-text" v-html="formatText(msg.content)"></div>
                </div>
                <div class="bubble-time">{{ msg.time }}</div>
              </div>
              <div v-if="msg.role === 'user'" class="avatar avatar-user">
                <i class="bi bi-person-fill"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 공유 입력 영역 -->
    <footer class="input-area">
      <div v-if="!selectedModelA || !selectedModelB" class="no-model-warn">
        <i class="bi bi-exclamation-circle me-1"></i>
        <span v-if="!selectedModelA && !selectedModelB">모델 A와 모델 B를 모두 선택해주세요</span>
        <span v-else-if="!selectedModelA">모델 A를 선택해주세요</span>
        <span v-else>모델 B를 선택해주세요</span>
      </div>
      <div class="input-wrap glass-panel" :class="{ focused: inputFocused }">
        <textarea
          v-model="inputText"
          ref="inputRef"
          class="chat-input"
          placeholder="두 모델에 동시에 질문합니다... (Shift+Enter: 줄바꿈)"
          :disabled="loadingA || loadingB || !selectedModelA || !selectedModelB"
          @focus="inputFocused = true"
          @blur="inputFocused = false"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
          rows="1"
        ></textarea>
        <div class="input-footer">
          <span class="char-count" :class="{ warn: inputText.length > 3000 }">
            {{ inputText.length.toLocaleString() }} 자
          </span>
          <div class="send-area">
            <span class="loading-both" v-if="loadingA || loadingB">
              <span class="spinner-border spinner-border-sm me-1"></span>
              <span v-if="loadingA && loadingB">A · B 응답 중...</span>
              <span v-else-if="loadingA">A 응답 중...</span>
              <span v-else>B 응답 중...</span>
            </span>
            <button
              class="send-btn"
              :disabled="!inputText.trim() || loadingA || loadingB || !selectedModelA || !selectedModelB"
              @click="sendMessage"
            >
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      </div>
      <p class="input-hint">Enter 동시 전송 · Shift+Enter 줄바꿈</p>
    </footer>

    <!-- 토스트 -->
    <Transition name="toast-fade">
      <div v-if="toast.show" class="toast-msg" :class="`toast-${toast.type}`">
        <i :class="`bi bi-${toast.type === 'danger' ? 'exclamation-circle' : 'check-circle'} me-2`"></i>
        {{ toast.text }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_APP_API_BASE

// ─── 모델 목록 ──────────────────────────────────────────────
const models        = ref([])
const selectedModelA = ref(null)
const selectedModelB = ref(null)
const dropdownOpenA  = ref(false)
const dropdownOpenB  = ref(false)
const dropdownRefA   = ref(null)
const dropdownRefB   = ref(null)

// ─── 채팅 상태 ──────────────────────────────────────────────
const messagesA = ref([])
const messagesB = ref([])
const loadingA  = ref(false)
const loadingB  = ref(false)

const inputText   = ref('')
const inputFocused = ref(false)
const inputRef    = ref(null)
const chatAreaRefA = ref(null)
const chatAreaRefB = ref(null)

const toast = ref({ show: false, type: 'success', text: '' })

// ─── 모델 그룹 ──────────────────────────────────────────────
const GROUP_COLORS = {
  'Gemini':      '#139c45',
  'MCP / NCP':   '#3a94c5',
  'Groq':        '#f55036',
  'OpenRouter':  '#7c3aed',
  'SiliconFlow': '#0ea5e9',
}

const groupColor = (group) => GROUP_COLORS[group] ?? '#3da89e'

const modelGroups = computed(() => {
  const map = {}
  for (const m of models.value) {
    if (!map[m.group]) map[m.group] = { name: m.group, models: [] }
    map[m.group].models.push(m)
  }
  return Object.values(map)
})

// ─── 초기화 ─────────────────────────────────────────────────
onMounted(async () => {
  await fetchModels()
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})

const fetchModels = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/lab1/api/llm/models`)
    models.value = data.models ?? []
    if (models.value.length >= 2) {
      selectedModelA.value = models.value[0]
      selectedModelB.value = models.value[1]
    } else if (models.value.length === 1) {
      selectedModelA.value = models.value[0]
    }
  } catch {
    models.value = [
      { id: 'gemini-2.5-pro',   name: 'Gemini 2.5 Pro',        group: 'Gemini',    provider: 'google' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash',       group: 'Gemini',    provider: 'google' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash',       group: 'Gemini',    provider: 'google' },
      { id: 'HCX-005',          name: 'HyperCLOVA X (HCX-005)', group: 'MCP / NCP', provider: 'ncp' },
    ]
    selectedModelA.value = models.value[0]
    selectedModelB.value = models.value[1]
  }
}

// ─── 드롭다운 ────────────────────────────────────────────────
const selectModelA = (m) => { selectedModelA.value = m; dropdownOpenA.value = false }
const selectModelB = (m) => { selectedModelB.value = m; dropdownOpenB.value = false }

const handleOutsideClick = (e) => {
  if (dropdownRefA.value && !dropdownRefA.value.contains(e.target)) dropdownOpenA.value = false
  if (dropdownRefB.value && !dropdownRefB.value.contains(e.target)) dropdownOpenB.value = false
}

// ─── 메시지 전송 (동시 병렬) ─────────────────────────────────
const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || loadingA.value || loadingB.value || !selectedModelA.value || !selectedModelB.value) return

  const timestamp = now()

  // 유저 메시지 양쪽 추가
  messagesA.value.push({ role: 'user', content: text, time: timestamp })
  messagesB.value.push({ role: 'user', content: text, time: timestamp })
  inputText.value = ''
  resetInputHeight()
  await Promise.all([scrollToBottom(chatAreaRefA), scrollToBottom(chatAreaRefB)])

  // 로딩 플레이스홀더 추가
  const idxA = messagesA.value.length
  const idxB = messagesB.value.length
  messagesA.value.push({ role: 'model', content: '', loading: true, modelName: selectedModelA.value.name, modelGroup: selectedModelA.value.group, time: now() })
  messagesB.value.push({ role: 'model', content: '', loading: true, modelName: selectedModelB.value.name, modelGroup: selectedModelB.value.group, time: now() })
  await Promise.all([scrollToBottom(chatAreaRefA), scrollToBottom(chatAreaRefB)])

  // 이전 히스토리 추출 (각 패널 독립)
  const historyA = messagesA.value.slice(0, idxA).filter(m => !m.loading).slice(-20).map(m => ({ role: m.role, content: m.content }))
  const historyB = messagesB.value.slice(0, idxB).filter(m => !m.loading).slice(-20).map(m => ({ role: m.role, content: m.content }))

  loadingA.value = true
  loadingB.value = true

  const modelA = selectedModelA.value
  const modelB = selectedModelB.value

  // 두 API를 동시 병렬 호출
  const [resultA, resultB] = await Promise.allSettled([
    axios.post(`${API_BASE}/lab1/api/llm/chat`, { model: modelA.id, message: text, history: historyA }),
    axios.post(`${API_BASE}/lab1/api/llm/chat`, { model: modelB.id, message: text, history: historyB }),
  ])

  // 패널 A 결과 처리
  if (resultA.status === 'fulfilled') {
    messagesA.value[idxA] = {
      role: 'model',
      content: resultA.value.data.answer,
      loading: false,
      modelName: resultA.value.data.model ?? modelA.name,
      modelGroup: modelA.group,
      time: now(),
    }
  } else {
    const errMsg = resultA.reason?.response?.data?.detail ?? resultA.reason?.message ?? '알 수 없는 오류'
    messagesA.value[idxA] = {
      role: 'model',
      content: `오류: ${errMsg}`,
      loading: false,
      modelName: modelA.name,
      modelGroup: modelA.group,
      time: now(),
      isError: true,
    }
    showToast('danger', `모델 A 오류: ${errMsg}`)
  }

  // 패널 B 결과 처리
  if (resultB.status === 'fulfilled') {
    messagesB.value[idxB] = {
      role: 'model',
      content: resultB.value.data.answer,
      loading: false,
      modelName: resultB.value.data.model ?? modelB.name,
      modelGroup: modelB.group,
      time: now(),
    }
  } else {
    const errMsg = resultB.reason?.response?.data?.detail ?? resultB.reason?.message ?? '알 수 없는 오류'
    messagesB.value[idxB] = {
      role: 'model',
      content: `오류: ${errMsg}`,
      loading: false,
      modelName: modelB.name,
      modelGroup: modelB.group,
      time: now(),
      isError: true,
    }
    showToast('danger', `모델 B 오류: ${errMsg}`)
  }

  loadingA.value = false
  loadingB.value = false
  await Promise.all([scrollToBottom(chatAreaRefA), scrollToBottom(chatAreaRefB)])
}

const clearAll = () => {
  messagesA.value = []
  messagesB.value = []
  inputText.value = ''
}

// ─── 유틸 ────────────────────────────────────────────────────
const scrollToBottom = async (areaRef) => {
  await nextTick()
  if (areaRef.value) areaRef.value.scrollTop = areaRef.value.scrollHeight
}

const autoResize = () => {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 140) + 'px'
}

const resetInputHeight = () => {
  if (inputRef.value) inputRef.value.style.height = 'auto'
}

const now = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const formatText = (text) => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><u>$1</u></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

const showToast = (type, text) => {
  toast.value = { show: true, type, text }
  setTimeout(() => { toast.value.show = false }, 3000)
}
</script>

<style scoped>
/* ─── 전체 레이아웃 ─────────────────────────────────────────── */
.mllm-wrap {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-via) 33%, var(--gradient-to) 66%, var(--gradient-from) 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
  position: relative;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--text-primary);
}

@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ─── 배경 아이콘 ───────────────────────────────────────────── */
.bg-icons { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.float-icon {
  position: absolute;
  color: var(--ci-primary);
  opacity: 0.12;
  animation: floatUpDown 6s ease-in-out infinite;
}
@keyframes floatUpDown {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-18px); }
}

/* ─── 유리형 패널 ───────────────────────────────────────────── */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(14px);
  border: 1px solid var(--sidebar-border);
  border-radius: 14px;
}

/* ─── 헤더 ──────────────────────────────────────────────────── */
.mllm-header {
  position: relative; z-index: 10;
  display: flex; align-items: center; gap: 16px;
  padding: 10px 20px;
  margin: 12px 16px 0;
  border-radius: 16px;
  flex-shrink: 0;
}

.header-left  { display: flex; align-items: center; gap: 12px; }
.header-center { flex: 1; display: flex; justify-content: center; }

.compare-badge {
  display: flex; align-items: center;
  padding: 5px 14px;
  background: rgba(124,58,237,.12);
  border: 1px solid rgba(124,58,237,.3);
  border-radius: 20px;
  font-size: .78rem; font-weight: 600;
  color: #a78bfa;
}

.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--item-bg-soft, rgba(0,0,0,0.05));
  color: var(--text-primary); font-size: 1.4rem; text-decoration: none;
  transition: background .2s;
}
.back-btn:hover { background: var(--ci-primary); color: #fff; }

.header-brand { display: flex; align-items: center; gap: 8px; }
.brand-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--ci-primary);
  box-shadow: 0 0 8px var(--ci-primary);
}
.brand-name   { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); letter-spacing: .5px; }
.brand-accent { color: var(--ci-primary); }
.brand-sub    { font-size: .75rem; color: var(--text-muted); margin-left: 4px; }

.clear-btn {
  display: flex; align-items: center;
  padding: 7px 14px;
  background: var(--item-bg-soft);
  border: 1px solid var(--sidebar-border);
  border-radius: 10px;
  color: var(--text-secondary); cursor: pointer; font-size: .82rem;
  white-space: nowrap; transition: all .2s; flex-shrink: 0;
}
.clear-btn:hover:not(:disabled) { background: rgba(255,92,92,.15); border-color: rgba(255,92,92,.4); color: #ff9999; }
.clear-btn:disabled { opacity: .35; cursor: default; }

/* ─── 듀얼 패널 ─────────────────────────────────────────────── */
.dual-panels {
  flex: 1;
  display: flex;
  gap: 0;
  overflow: hidden;
  position: relative; z-index: 1;
  padding: 12px 16px 0;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* ─── 패널 헤더 (모델 선택) ─────────────────────────────────── */
.panel-header {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.panel-label {
  display: flex; align-items: center;
  font-size: .8rem; font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}
.panel-label-a { color: #60a5fa; }
.panel-label-b { color: #f472b6; }

/* ─── 구분선 ─────────────────────────────────────────────────── */
.panel-divider {
  width: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.panel-divider::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  left: 50%;
  width: 1px;
  background: linear-gradient(to bottom, transparent, var(--sidebar-border) 20%, var(--sidebar-border) 80%, transparent);
}
.divider-vs {
  position: relative; z-index: 1;
  background: var(--glass-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 50%;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 800;
  color: var(--text-muted);
  backdrop-filter: blur(8px);
}

/* ─── 모델 셀렉터 ───────────────────────────────────────────── */
.custom-select-wrap { position: relative; flex: 1; min-width: 0; }

.custom-select-btn {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 7px 12px;
  background: var(--glass-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 10px;
  color: var(--text-primary); cursor: pointer; font-size: .85rem;
  transition: border-color .2s, background .2s;
}
.custom-select-btn:hover,
.custom-select-wrap.open .custom-select-btn {
  border-color: var(--ci-primary);
  background: var(--item-hover-bg, rgba(19,156,69,.08));
}

.selected-model-info { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.placeholder-text { color: var(--text-muted); flex: 1; font-size: .82rem; }
.selected-model-name { font-weight: 600; font-size: .85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chevron-icon { margin-left: auto; font-size: .75rem; color: var(--text-muted); transition: transform .25s; flex-shrink: 0; }
.chevron-icon.rotated { transform: rotate(180deg); }

.dropdown-panel {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  z-index: 200;
  padding: 8px;
  max-height: 300px; overflow-y: auto;
  animation: dropIn .18s ease;
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dropdown-panel::-webkit-scrollbar { width: 4px; }
.dropdown-panel::-webkit-scrollbar-thumb { background: var(--scrollbar-bg); border-radius: 4px; }

.model-group { margin-bottom: 6px; }
.group-header {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px 6px;
  font-size: .7rem; font-weight: 700; letter-spacing: .8px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 4px;
}
.group-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.model-option {
  width: 100%; display: flex; align-items: center; gap: 6px;
  padding: 7px 10px;
  background: transparent; border: none; border-radius: 8px;
  color: var(--text-secondary); cursor: pointer; font-size: .83rem;
  text-align: left; transition: background .15s;
}
.model-option:hover  { background: var(--item-hover-bg); color: var(--text-primary); }
.model-option.active { background: var(--ci-primary); color: #fff; }
.check-icon { color: var(--ci-primary); font-size: .8rem; }
.model-option.active .check-icon { color: #fff; }
.model-id-tag { margin-left: auto; font-size: .68rem; color: var(--text-muted); font-family: monospace; }

.model-group-badge {
  display: inline-block;
  padding: 1px 6px; border-radius: 20px;
  font-size: .65rem; font-weight: 700; color: #fff;
  white-space: nowrap; flex-shrink: 0;
}
.model-group-badge.sm { font-size: .62rem; padding: 1px 5px; }

/* ─── 채팅 영역 ─────────────────────────────────────────────── */
.chat-area {
  flex: 1; overflow-y: auto;
  padding: 8px 4px;
}
.chat-area::-webkit-scrollbar { width: 3px; }
.chat-area::-webkit-scrollbar-thumb { background: var(--scrollbar-bg); border-radius: 4px; }

/* ─── 빈 상태 ───────────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: 12px; text-align: center;
}
.empty-icon-wrap {
  width: 58px; height: 58px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.empty-a {
  background: rgba(96,165,250,.12);
  border: 2px solid rgba(96,165,250,.3);
}
.empty-b {
  background: rgba(244,114,182,.12);
  border: 2px solid rgba(244,114,182,.3);
}
.empty-icon { font-size: 1.6rem; color: var(--ci-primary); }
.empty-a .empty-icon { color: #60a5fa; }
.empty-b .empty-icon { color: #f472b6; }
.empty-desc { color: var(--text-muted); font-size: .82rem; line-height: 1.6; margin: 0; }

/* ─── 메시지 ─────────────────────────────────────────────────── */
.messages-list { display: flex; flex-direction: column; gap: 14px; }

.msg-row   { display: flex; align-items: flex-start; gap: 8px; }
.msg-user  { flex-direction: row-reverse; }
.msg-model { flex-direction: row; }

.avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; flex-shrink: 0; margin-top: 4px;
}
.avatar-user  { background: linear-gradient(135deg, var(--ci-primary), #3da89e); color: #fff; }
.avatar-model { background: rgba(58,148,197,.2); border: 1px solid rgba(58,148,197,.3); color: var(--ci-secondary); }
.avatar-a { background: rgba(96,165,250,.2); border-color: rgba(96,165,250,.4); color: #60a5fa; }
.avatar-b { background: rgba(244,114,182,.2); border-color: rgba(244,114,182,.4); color: #f472b6; }

.bubble-wrap { display: flex; flex-direction: column; gap: 3px; max-width: calc(100% - 42px); }
.msg-user  .bubble-wrap { align-items: flex-end; }
.msg-model .bubble-wrap { align-items: flex-start; }

.bubble-meta { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
.bubble-model-name { font-size: .72rem; color: var(--text-muted); }

.bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: .85rem; line-height: 1.6;
  word-break: break-word;
  max-width: 100%;
}
.bubble-user {
  background: linear-gradient(135deg, rgba(19,156,69,.15), rgba(61,168,158,.1));
  border: 1px solid rgba(19,156,69,.3);
  color: var(--text-primary); border-bottom-right-radius: 4px;
}
.bubble-model {
  background: var(--glass-bg);
  border: 1px solid var(--sidebar-border);
  color: var(--text-primary); border-bottom-left-radius: 4px;
}
.bubble-error {
  background: rgba(220,53,69,.08);
  border-color: rgba(220,53,69,.3);
  color: #ff9999;
}
.bubble-model :deep(code) {
  background: var(--item-bg-soft); padding: 1px 4px;
  border-radius: 4px; font-family: monospace; font-size: .82em; color: var(--ci-primary);
}

.bubble-time { font-size: .67rem; color: var(--text-muted); padding: 0 3px; }

.typing-indicator { display: flex; gap: 5px; align-items: center; padding: 2px 0; }
.typing-indicator span {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-muted);
  animation: typingBounce 1.2s infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: .2s; }
.typing-indicator span:nth-child(3) { animation-delay: .4s; }
@keyframes typingBounce {
  0%,60%,100% { transform: translateY(0); opacity: .4; }
  30%         { transform: translateY(-5px); opacity: 1; }
}

/* ─── 입력 영역 ─────────────────────────────────────────────── */
.input-area {
  position: relative; z-index: 10;
  padding: 8px 16px 12px;
  flex-shrink: 0;
}

.no-model-warn {
  font-size: .78rem; color: #ffd166;
  margin-bottom: 5px; display: flex; align-items: center;
  justify-content: center;
}

.input-wrap {
  border-radius: 16px;
  padding: 10px 14px 8px;
  transition: border-color .2s;
  background: var(--glass-bg);
}
.input-wrap.focused { border-color: var(--ci-primary); }

.chat-input {
  width: 100%; background: transparent; border: none; outline: none;
  color: var(--text-primary); font-size: .9rem; line-height: 1.5; resize: none;
  min-height: 36px; max-height: 140px;
  font-family: inherit;
}
.chat-input::placeholder { color: var(--text-muted); }
.chat-input:disabled { opacity: .45; cursor: not-allowed; }

.input-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 5px;
}
.char-count { font-size: .7rem; color: var(--text-muted); }
.char-count.warn { color: #ff9f43; }

.send-area { display: flex; align-items: center; gap: 8px; }

.loading-both {
  display: flex; align-items: center;
  font-size: .75rem; color: var(--text-muted);
  white-space: nowrap;
}

.send-btn {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ci-primary), #3da89e);
  border: none; color: #fff; font-size: .9rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity .2s, transform .15s;
}
.send-btn:hover:not(:disabled) { opacity: .85; transform: scale(1.08); }
.send-btn:disabled { opacity: .3; cursor: not-allowed; transform: none; }

.input-hint { text-align: center; font-size: .68rem; color: var(--text-muted); margin: 4px 0 0; }

/* ─── 토스트 ─────────────────────────────────────────────────── */
.toast-msg {
  position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
  z-index: 9999;
  padding: 10px 20px; border-radius: 24px;
  font-size: .85rem; font-weight: 600; color: #fff;
  display: flex; align-items: center;
  backdrop-filter: blur(12px);
  white-space: nowrap;
}
.toast-success { background: rgba(19,156,69,.8); border: 1px solid rgba(19,156,69,.5); }
.toast-danger  { background: rgba(220,53,69,.8); border: 1px solid rgba(220,53,69,.5); }

.toast-fade-enter-active, .toast-fade-leave-active { transition: all .3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }
</style>

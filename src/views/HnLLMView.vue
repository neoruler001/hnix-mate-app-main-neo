<template>
  <div class="hnllm-page-layout">
    <AppSidebar />
  <div class="hnllm-wrap">
    <!-- 배경 floating 아이콘 -->
    <div class="bg-icons" aria-hidden="true">
      <i class="bi bi-cpu float-icon" style="top:8%;left:5%;font-size:2.8rem;animation-delay:0s"></i>
      <i class="bi bi-braces float-icon" style="top:20%;right:8%;font-size:2rem;animation-delay:1.2s"></i>
      <i class="bi bi-lightning-charge float-icon" style="bottom:25%;left:12%;font-size:2.2rem;animation-delay:2.1s"></i>
      <i class="bi bi-stars float-icon" style="bottom:15%;right:15%;font-size:1.8rem;animation-delay:0.8s"></i>
      <i class="bi bi-robot float-icon" style="top:50%;left:3%;font-size:2.5rem;animation-delay:1.7s"></i>
    </div>

    <!-- 헤더 -->
    <header class="hnllm-header glass-panel">
      <div class="header-left">
        <div class="header-brand">
          <span class="brand-dot"></span>
          <span class="brand-name">HN <span class="brand-accent">LLM</span></span>
          <span class="brand-sub">멀티 모델 채팅</span>
        </div>
      </div>

      <!-- 모델 선택 드롭다운 -->
      <div class="model-selector-wrap">
        <label class="selector-label">
          <i class="bi bi-cpu me-1"></i>모델 선택
        </label>
        <div class="custom-select-wrap" :class="{ open: dropdownOpen }" ref="dropdownRef">
          <button class="custom-select-btn glass-panel" @click="dropdownOpen = !dropdownOpen">
            <span class="selected-model-info" v-if="selectedModel">
              <span class="model-group-badge" :style="{ background: groupColor(selectedModel.group) }">
                {{ selectedModel.group }}
              </span>
              <span class="selected-model-name">{{ selectedModel.name }}</span>
            </span>
            <span v-else class="placeholder-text">모델을 선택하세요</span>
            <i class="bi bi-chevron-down chevron-icon" :class="{ rotated: dropdownOpen }"></i>
          </button>

          <div class="dropdown-panel glass-panel" v-show="dropdownOpen">
            <div v-for="group in modelGroups" :key="group.name" class="model-group">
              <div class="group-header" :style="{ borderColor: groupColor(group.name) }">
                <span class="group-dot" :style="{ background: groupColor(group.name) }"></span>
                {{ group.name }}
              </div>
              <button
                v-for="m in group.models"
                :key="m.id"
                class="model-option"
                :class="{ active: selectedModel && selectedModel.id === m.id }"
                @click="selectModel(m)"
              >
                <i class="bi bi-check2 check-icon" v-if="selectedModel && selectedModel.id === m.id"></i>
                <span>{{ m.name }}</span>
                <span class="model-id-tag">{{ m.id }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 대화 초기화 버튼 -->
      <button class="clear-btn" @click="clearChat" title="대화 초기화" :disabled="messages.length === 0">
        <i class="bi bi-arrow-counterclockwise me-1"></i>초기화
      </button>
    </header>

    <!-- 채팅 영역 -->
    <main class="chat-area" ref="chatAreaRef">
      <!-- 빈 상태 -->
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon-wrap">
          <i class="bi bi-chat-dots-fill empty-icon"></i>
        </div>
        <h2 class="empty-title">무엇이든 물어보세요</h2>
        <p class="empty-desc">
          모델을 선택하고 질문을 입력하면<br>선택한 LLM이 직접 답변합니다.
        </p>
        <div class="quick-prompts">
          <button
            v-for="q in quickPrompts"
            :key="q"
            class="quick-prompt-btn glass-panel"
            @click="useQuickPrompt(q)"
          >{{ q }}</button>
        </div>
      </div>

      <!-- 메시지 목록 -->
      <div v-else class="messages-list">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="msg-row"
          :class="msg.role === 'user' ? 'msg-user' : 'msg-model'"
        >
          <!-- 모델 아바타 -->
          <div v-if="msg.role === 'model'" class="avatar avatar-model">
            <i class="bi bi-robot"></i>
          </div>

          <div class="bubble-wrap">
            <!-- 모델명 표시 (assistant) -->
            <div v-if="msg.role === 'model'" class="bubble-meta">
              <span class="model-group-badge sm" :style="{ background: groupColor(msg.modelGroup) }">
                {{ msg.modelGroup }}
              </span>
              <span class="bubble-model-name">{{ msg.modelName }}</span>
            </div>

            <div class="bubble" :class="msg.role === 'user' ? 'bubble-user' : 'bubble-model'">
              <!-- 로딩 인디케이터 -->
              <div v-if="msg.loading" class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
              <!-- 텍스트 -->
              <div v-else class="bubble-text" v-html="formatText(msg.content)"></div>
            </div>

            <div class="bubble-time">{{ msg.time }}</div>
          </div>

          <!-- 유저 아바타 -->
          <div v-if="msg.role === 'user'" class="avatar avatar-user">
            <i class="bi bi-person-fill"></i>
          </div>
        </div>
      </div>
    </main>

    <!-- 입력 영역 -->
    <footer class="input-area">
      <div class="input-wrap glass-panel" :class="{ focused: inputFocused }">
        <!-- 모델 미선택 경고 -->
        <div v-if="!selectedModel" class="no-model-warn">
          <i class="bi bi-exclamation-circle me-1"></i>위에서 모델을 먼저 선택해주세요
        </div>

        <textarea
          v-model="inputText"
          ref="inputRef"
          class="chat-input"
          placeholder="질문을 입력하세요... (Shift+Enter: 줄바꿈)"
          :disabled="loading || !selectedModel"
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
          <button
            class="send-btn"
            :disabled="!inputText.trim() || loading || !selectedModel"
            @click="sendMessage"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
      <p class="input-hint">Enter 전송 · Shift+Enter 줄바꿈</p>
    </footer>

    <!-- 토스트 -->
    <Transition name="toast-fade">
      <div v-if="toast.show" class="toast-msg" :class="`toast-${toast.type}`">
        <i :class="`bi bi-${toast.type === 'danger' ? 'exclamation-circle' : 'check-circle'} me-2`"></i>
        {{ toast.text }}
      </div>
    </Transition>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import AppSidebar from '../components/common/AppSidebar.vue'

// ─── 상태 ──────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_APP_API_BASE   // /api-proxy

const models        = ref([])
const selectedModel = ref(null)
const dropdownOpen  = ref(false)
const dropdownRef   = ref(null)

const messages   = ref([])
const inputText  = ref('')
const loading    = ref(false)
const inputFocused = ref(false)

const chatAreaRef = ref(null)
const inputRef    = ref(null)

const toast = ref({ show: false, type: 'success', text: '' })

const quickPrompts = [
  '최신 AI 트렌드를 요약해줘',
  'Vue 3 Composition API 장점은?',
  'FastAPI와 Django의 차이를 설명해줘',
  '파이썬으로 간단한 REST API 예시 작성해줘',
]

// ─── 모델 그룹 ─────────────────────────────────────────────────
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

// ─── 초기화 ────────────────────────────────────────────────────
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
    if (models.value.length) selectedModel.value = models.value[0]
  } catch {
    // 백엔드 연결 실패 시 기본 목록 사용
    models.value = [
      { id: 'gemini-2.5-pro',   name: 'Gemini 2.5 Pro',          group: 'Gemini',     provider: 'google' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash',         group: 'Gemini',     provider: 'google' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash',         group: 'Gemini',     provider: 'google' },
      { id: 'HCX-005',          name: 'HyperCLOVA X (HCX-005)',   group: 'MCP / NCP',  provider: 'ncp' },
    ]
    selectedModel.value = models.value[0]
  }
}

// ─── 드롭다운 ──────────────────────────────────────────────────
const selectModel = (m) => {
  selectedModel.value = m
  dropdownOpen.value = false
}

const handleOutsideClick = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

// ─── 메시지 전송 ───────────────────────────────────────────────
const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value || !selectedModel.value) return

  // 유저 메시지 추가
  messages.value.push({
    role: 'user',
    content: text,
    time: now(),
  })
  inputText.value = ''
  resetInputHeight()
  await scrollToBottom()

  // 로딩 플레이스홀더 추가
  const loadingIdx = messages.value.length
  messages.value.push({
    role: 'model',
    content: '',
    loading: true,
    modelName: selectedModel.value.name,
    modelGroup: selectedModel.value.group,
    time: now(),
  })
  await scrollToBottom()

  loading.value = true
  try {
    // 이전 대화 기록 (최근 10턴)
    const history = messages.value
      .slice(0, loadingIdx)
      .filter(m => !m.loading)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    const { data } = await axios.post(`${API_BASE}/lab1/api/llm/chat`, {
      model: selectedModel.value.id,
      message: text,
      history,
    })

    messages.value[loadingIdx] = {
      role: 'model',
      content: data.answer,
      loading: false,
      modelName: data.model ?? selectedModel.value.name,
      modelGroup: selectedModel.value.group,
      time: now(),
    }
  } catch (err) {
    const errMsg = err.response?.data?.detail ?? err.message ?? '알 수 없는 오류'
    messages.value[loadingIdx] = {
      role: 'model',
      content: `오류가 발생했습니다: ${errMsg}`,
      loading: false,
      modelName: selectedModel.value.name,
      modelGroup: selectedModel.value.group,
      time: now(),
      isError: true,
    }
    showToast('danger', '답변 요청 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

const useQuickPrompt = (q) => {
  inputText.value = q
  nextTick(() => inputRef.value?.focus())
}

const clearChat = () => {
  messages.value = []
  inputText.value = ''
}

// ─── 유틸 ──────────────────────────────────────────────────────
const scrollToBottom = async () => {
  await nextTick()
  if (chatAreaRef.value) {
    chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
  }
}

const autoResize = () => {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
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
.hnllm-page-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.hnllm-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  height: 100%;
  background: linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-via) 33%, var(--gradient-to) 66%, var(--gradient-from) 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
  position: relative;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--text-primary);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ─── 배경 아이콘 ───────────────────────────────────────────── */
.bg-icons { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.float-icon {
  position: absolute;
  color: var(--ci-primary);
  opacity: 0.15;
  animation: floatUpDown 6s ease-in-out infinite;
}
@keyframes floatUpDown {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-18px); }
}

/* ─── 유리형 패널 ───────────────────────────────────────────── */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(14px);
  border: 1px solid var(--sidebar-border);
  border-radius: 14px;
}

/* ─── 헤더 ──────────────────────────────────────────────────── */
.hnllm-header {
  position: relative; z-index: 10;
  display: flex; align-items: center; gap: 16px;
  padding: 10px 20px;
  margin: 12px 16px 0;
  border-radius: 16px;
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 12px; }

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
  width: 8px; height: 8px;
  border-radius: 50%; background: var(--ci-primary);
  box-shadow: 0 0 8px var(--ci-primary);
}
.brand-name { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); letter-spacing: .5px; }
.brand-accent { color: var(--ci-primary); }
.brand-sub { font-size: .75rem; color: var(--text-muted); margin-left: 4px; }

/* ─── 모델 셀렉터 ───────────────────────────────────────────── */
.model-selector-wrap {
  display: flex; align-items: center; gap: 10px;
  margin-left: auto;
}
.selector-label { font-size: .8rem; color: var(--text-muted); white-space: nowrap; }

.custom-select-wrap { position: relative; min-width: 280px; }

.custom-select-btn {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: var(--glass-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 10px;
  color: var(--text-primary); cursor: pointer; font-size: .9rem;
  transition: border-color .2s, background .2s;
}
.custom-select-btn:hover,
.custom-select-wrap.open .custom-select-btn {
  border-color: var(--ci-primary);
  background: var(--item-hover-bg, rgba(19,156,69,.08));
}

.selected-model-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.placeholder-text { color: var(--text-muted); flex: 1; }
.selected-model-name { font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chevron-icon { margin-left: auto; font-size: .8rem; color: var(--text-muted); transition: transform .25s; }
.chevron-icon.rotated { transform: rotate(180deg); }

/* 드롭다운 패널 */
.dropdown-panel {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  z-index: 100;
  padding: 8px;
  max-height: 360px; overflow-y: auto;
  animation: dropIn .18s ease;
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dropdown-panel::-webkit-scrollbar { width: 4px; }
.dropdown-panel::-webkit-scrollbar-thumb { background: var(--scrollbar-bg); border-radius: 4px; }

.model-group { margin-bottom: 6px; }
.group-header {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px 6px;
  font-size: .72rem; font-weight: 700; letter-spacing: .8px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 4px;
}
.group-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.model-option {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  background: transparent; border: none; border-radius: 8px;
  color: var(--text-secondary); cursor: pointer; font-size: .88rem;
  text-align: left; transition: background .15s;
}
.model-option:hover { background: var(--item-hover-bg); color: var(--text-primary); }
.model-option.active { background: var(--ci-primary); color: #fff; }
.check-icon { color: var(--ci-primary); font-size: .85rem; }
.model-option.active .check-icon { color: #fff; }
.model-id-tag {
  margin-left: auto;
  font-size: .7rem; color: var(--text-muted);
  font-family: monospace;
}

/* 그룹 뱃지 */
.model-group-badge {
  display: inline-block;
  padding: 1px 7px; border-radius: 20px;
  font-size: .68rem; font-weight: 700; color: #fff;
  white-space: nowrap; flex-shrink: 0;
}
.model-group-badge.sm { font-size: .65rem; padding: 1px 6px; }

/* ─── 초기화 버튼 ───────────────────────────────────────────── */
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

/* ─── 채팅 영역 ─────────────────────────────────────────────── */
.chat-area {
  flex: 1; overflow-y: auto;
  padding: 20px 16px;
  position: relative; z-index: 1;
}
.chat-area::-webkit-scrollbar { width: 4px; }
.chat-area::-webkit-scrollbar-thumb { background: var(--scrollbar-bg); border-radius: 4px; }

/* ─── 빈 상태 ───────────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: 16px; text-align: center;
}
.empty-icon-wrap {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(19,156,69,.12);
  border: 2px solid rgba(19,156,69,.3);
  display: flex; align-items: center; justify-content: center;
}
.empty-icon { font-size: 2rem; color: var(--ci-primary); }
.empty-title { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.empty-desc { color: var(--text-muted); font-size: .9rem; line-height: 1.6; margin: 0; }

.quick-prompts { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; max-width: 600px; }
.quick-prompt-btn {
  padding: 8px 16px;
  background: var(--glass-bg);
  border: 1px solid var(--sidebar-border); border-radius: 20px;
  color: var(--text-secondary); cursor: pointer; font-size: .82rem;
  transition: all .2s;
}
.quick-prompt-btn:hover { background: var(--item-hover-bg); color: var(--ci-primary); border-color: var(--ci-primary); }

/* ─── 메시지 ─────────────────────────────────────────────────── */
.messages-list { display: flex; flex-direction: column; gap: 18px; max-width: 860px; margin: 0 auto; }

.msg-row { display: flex; align-items: flex-start; gap: 10px; }
.msg-user  { flex-direction: row-reverse; }
.msg-model { flex-direction: row; }

.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .95rem; flex-shrink: 0; margin-top: 4px;
}
.avatar-user  { background: linear-gradient(135deg, var(--ci-primary), #3da89e); color: #fff; }
.avatar-model { background: rgba(58,148,197,.25); border: 1px solid rgba(58,148,197,.4); color: var(--ci-secondary); }

.bubble-wrap { display: flex; flex-direction: column; gap: 4px; max-width: calc(100% - 50px); }
.msg-user .bubble-wrap { align-items: flex-end; }
.msg-model .bubble-wrap { align-items: flex-start; }

.bubble-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.bubble-model-name { font-size: .75rem; color: var(--text-muted); }

.bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: .9rem; line-height: 1.65;
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
.bubble-model :deep(code) {
  background: var(--item-bg-soft); padding: 1px 5px;
  border-radius: 4px; font-family: monospace; font-size: .85em; color: var(--ci-primary);
}

.bubble-time { font-size: .7rem; color: var(--text-muted); padding: 0 4px; }

/* 타이핑 인디케이터 */
.typing-indicator { display: flex; gap: 5px; align-items: center; padding: 2px 0; }
.typing-indicator span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--text-muted);
  animation: typingBounce 1.2s infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: .2s; }
.typing-indicator span:nth-child(3) { animation-delay: .4s; }
@keyframes typingBounce {
  0%,60%,100% { transform: translateY(0); opacity: .4; }
  30%          { transform: translateY(-6px); opacity: 1; }
}

/* ─── 입력 영역 ─────────────────────────────────────────────── */
.input-area {
  position: relative; z-index: 10;
  padding: 10px 16px 14px;
  flex-shrink: 0;
}
.input-wrap {
  border-radius: 16px;
  padding: 10px 14px 8px;
  transition: border-color .2s;
  background: var(--glass-bg);
}
.input-wrap.focused { border-color: var(--ci-primary); }

.no-model-warn {
  font-size: .8rem; color: #ffd166;
  margin-bottom: 6px; display: flex; align-items: center;
}

.chat-input {
  width: 100%; background: transparent; border: none; outline: none;
  color: var(--text-primary); font-size: .92rem; line-height: 1.5; resize: none;
  min-height: 38px; max-height: 160px;
  font-family: inherit;
}
.chat-input::placeholder { color: var(--text-muted); }
.chat-input:disabled { opacity: .45; cursor: not-allowed; }

.input-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 6px;
}
.char-count { font-size: .73rem; color: var(--text-muted); }
.char-count.warn { color: #ff9f43; }

.send-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ci-primary), #3da89e);
  border: none; color: #fff; font-size: .95rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity .2s, transform .15s;
}
.send-btn:hover:not(:disabled) { opacity: .85; transform: scale(1.08); }
.send-btn:disabled { opacity: .3; cursor: not-allowed; transform: none; }

.input-hint { text-align: center; font-size: .7rem; color: var(--text-muted); margin: 5px 0 0; }

/* ─── 토스트 ─────────────────────────────────────────────────── */
.toast-msg {
  position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
  z-index: 9999;
  padding: 10px 20px; border-radius: 24px;
  font-size: .88rem; font-weight: 600; color: #fff;
  display: flex; align-items: center;
  backdrop-filter: blur(12px);
  white-space: nowrap;
}
.toast-success { background: rgba(19,156,69,.8); border: 1px solid rgba(19,156,69,.5); }
.toast-danger  { background: rgba(220,53,69,.8); border: 1px solid rgba(220,53,69,.5); }

.toast-fade-enter-active, .toast-fade-leave-active { transition: all .3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }
</style>

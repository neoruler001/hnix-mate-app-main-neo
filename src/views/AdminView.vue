<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// FastAPI 백엔드 (Vite proxy → http://49.50.131.163:8080)
const API = import.meta.env.VITE_APP_API_BASE + '/lab1/api'

const router = useRouter()

// ─── Auth ─────────────────────────────────────────────────────
const isLoggedIn = ref(false)
const currentUser = ref(null)
const authMode = ref('login') // 'login' | 'register'
const isLoading = ref(false)

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({ email: '', name: '', phone: '', password: '', deptId: '' })

// ─── UI ───────────────────────────────────────────────────────
const activeMenu = ref('users') // 'users' | 'teams' | 'permissions'
const alert = reactive({ show: false, type: 'success', text: '' })

// ─── Users ────────────────────────────────────────────────────
const users = ref([])
const userSearch = ref('')
const showUserModal = ref(false)
const userModalMode = ref('add')
const userForm = reactive({ email: '', name: '', phone: '', deptId: '' })
const editingEmail = ref('')

// ─── Departments ──────────────────────────────────────────────
const departments = ref([])
const showDeptModal = ref(false)
const deptModalMode = ref('add')
const deptForm = reactive({ deptName: '', deptId: '', name: '' })

// ─── Document Permissions ─────────────────────────────────────
const docPermissions = ref([])
const docSearch = ref('')
const showPermModal = ref(false)
const permForm = reactive({ fileName: '', deptId: '' })

// ─── Computed ─────────────────────────────────────────────────
const filteredUsers = computed(() => {
  const q = userSearch.value.toLowerCase()
  return users.value.filter(u =>
    u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  )
})

const filteredDocs = computed(() => {
  const q = docSearch.value.toLowerCase()
  return docPermissions.value.filter(d => d.fileName?.toLowerCase().includes(q))
})

// ─── Alert ────────────────────────────────────────────────────
const showAlert = (type, text) => {
  alert.show = true
  alert.type = type
  alert.text = text
  setTimeout(() => { alert.show = false }, 3000)
}

// ─── Helpers ──────────────────────────────────────────────────
const unwrap = (data) => {
  // FastAPI 응답: { status, data: [...] } 또는 배열 직접 반환
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return data?.data ?? data
}

// ─── Auth Functions ───────────────────────────────────────────
onMounted(async () => {
  await fetchDepartments()
  const saved = localStorage.getItem('hnix_user')
  if (saved) {
    try {
      const user = JSON.parse(saved)
      // 관리자 권한이 있는 경우에만 로드
      if (user && user.isAdmin) {
        currentUser.value = user
        isLoggedIn.value = true
        loadAll()
      } else {
        // 관리자가 아니면 로그인 화면 유지 (라우트 가드가 이미 막음)
        isLoggedIn.value = false
      }
    } catch {
      isLoggedIn.value = false
    }
  }
})

const doLogin = async () => {
  if (!loginForm.email || !loginForm.password) return showAlert('danger', '이메일과 비밀번호를 입력해주세요.')
  isLoading.value = true
  try {
    const { data } = await axios.post(`${API}/users/detail`, { email: loginForm.email })
    const user = unwrap(data)
    if (!user || !user.email) return showAlert('danger', '등록되지 않은 이메일입니다.')
    if (user.password !== loginForm.password) return showAlert('danger', '비밀번호가 일치하지 않습니다.')
    // 관리자 권한 확인
    if (!user.isAdmin) return showAlert('danger', '관리자만 접근 가능합니다.')

    currentUser.value = {
      email: user.email,
      name: user.name,
      deptName: user.deptName ?? '',
      isAdmin: user.isAdmin
    }
    // hnix_user 키 사용 (HomeView와 동일)
    localStorage.setItem('hnix_user', JSON.stringify(currentUser.value))
    isLoggedIn.value = true
    loginForm.email = ''
    loginForm.password = ''
    loadAll()
  } catch (e) {
    showAlert('danger', e.response?.status === 404 ? '등록되지 않은 이메일입니다.' : '로그인 중 오류가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}

const doRegister = async () => {
  const { email, name, phone, password, deptId } = registerForm
  if (!email || !name || !password || !deptId) return showAlert('danger', '필수 항목을 모두 입력해주세요.')
  isLoading.value = true
  try {
    await axios.post(`${API}/register`, { email, name, phone, password, deptId })
    showAlert('success', '회원가입이 완료됐습니다. 로그인해주세요.')
    authMode.value = 'login'
    Object.assign(registerForm, { email: '', name: '', phone: '', password: '', deptId: '' })
  } catch (e) {
    const msg = e.response?.data?.detail?.[0]?.msg ?? e.response?.data?.message ?? '회원가입 중 오류가 발생했습니다.'
    showAlert('danger', msg)
  } finally {
    isLoading.value = false
  }
}

const doLogout = () => {
  // hnix_user 키 제거 (HomeView와 동일)
  localStorage.removeItem('hnix_user')
  isLoggedIn.value = false
  currentUser.value = null
  users.value = []
  departments.value = []
  docPermissions.value = []
}

// ─── Load All ─────────────────────────────────────────────────
const loadAll = () => {
  fetchUsers()
  fetchDepartments()
  fetchDocPermissions()
}

// ─── Users API ────────────────────────────────────────────────
const fetchUsers = async () => {
  try {
    const { data } = await axios.get(`${API}/users`)
    users.value = Array.isArray(unwrap(data)) ? unwrap(data) : []
  } catch {
    showAlert('danger', '사용자 목록을 불러오지 못했습니다.')
  }
}

const toggleAdmin = async (user) => {
  const action = user.isAdmin ? '회수' : '부여'
  if (!confirm(`"${user.name}"의 관리자 권한을 ${action}하시겠습니까?`)) return
  try {
    await axios.post(`${API}/users/admin`, { email: user.email, isAdmin: !user.isAdmin })
    showAlert('success', `관리자 권한이 ${action}되었습니다.`)
    await fetchUsers()
  } catch {
    showAlert('danger', `관리자 권한 ${action} 중 오류가 발생했습니다.`)
  }
}

const openAddUser = () => {
  userModalMode.value = 'add'
  Object.assign(userForm, { email: '', name: '', phone: '', deptId: '' })
  showUserModal.value = true
}

const openEditUser = (user) => {
  userModalMode.value = 'edit'
  editingEmail.value = user.email
  Object.assign(userForm, { email: user.email, name: user.name, phone: user.phone || '', deptId: user.deptId || '' })
  showUserModal.value = true
}

const saveUser = async () => {
  isLoading.value = true
  try {
    if (userModalMode.value === 'add') {
      if (!userForm.email || !userForm.name || !userForm.deptId) return showAlert('danger', '필수 항목을 입력해주세요.')
      await axios.post(`${API}/register`, {
        email: userForm.email, name: userForm.name,
        phone: userForm.phone || '', password: 'temp1234', deptId: userForm.deptId
      })
      showAlert('success', '사용자가 추가됐습니다. 초기 비밀번호: temp1234')
    } else {
      await axios.post(`${API}/users/update`, {
        email: editingEmail.value,
        name: userForm.name,
        phone: userForm.phone || '',
        deptId: userForm.deptId
      })
      showAlert('success', '사용자 정보가 수정됐습니다.')
    }
    showUserModal.value = false
    await fetchUsers()
  } catch (e) {
    const msg = e.response?.data?.detail?.[0]?.msg ?? e.response?.data?.message ?? '저장 중 오류가 발생했습니다.'
    showAlert('danger', msg)
  } finally {
    isLoading.value = false
  }
}

const deleteUser = async (email) => {
  if (!confirm(`"${email}" 사용자를 삭제하시겠습니까?`)) return
  try {
    await axios.post(`${API}/users/delete`, { email })
    showAlert('success', '사용자가 삭제됐습니다.')
    await fetchUsers()
  } catch {
    showAlert('danger', '삭제 중 오류가 발생했습니다.')
  }
}

// ─── Departments API ──────────────────────────────────────────
const DEPT_FALLBACK = [
  { id: '65afa76a-2876-46b7-a293-8c4b4150d357', name: 'HD현대개발팀' },
  { id: '65d0de11-e641-4a2e-b164-8e18edb30bd4', name: 'HD현대운영팀' },
  { id: '611522e2-63bc-409a-9944-a391af21753b', name: 'HD현대함정,중형선팀' },
  { id: '29b1e57a-4bce-4e67-9c75-33a69d2fed05', name: 'AX추진팀' },
  { id: '855ce555-c32a-4593-91e5-350593895d21', name: 'AX전략팀' },
]

const fetchDepartments = async () => {
  try {
    const { data } = await axios.get(`${API}/departments`)
    const list = (Array.isArray(unwrap(data)) ? unwrap(data) : [])
      .filter(d => d.id && d.name)
    departments.value = list.length ? list : DEPT_FALLBACK
  } catch {
    departments.value = DEPT_FALLBACK
  }
}

const openAddDept = () => {
  deptModalMode.value = 'add'
  Object.assign(deptForm, { deptName: '', deptId: '', name: '' })
  showDeptModal.value = true
}

const openEditDept = (dept) => {
  deptModalMode.value = 'edit'
  Object.assign(deptForm, { deptId: dept.id, name: dept.name })
  showDeptModal.value = true
}

const saveDept = async () => {
  isLoading.value = true
  try {
    if (deptModalMode.value === 'add') {
      if (!deptForm.deptName) return showAlert('danger', '팀 이름을 입력해주세요.')
      await axios.post(`${API}/department/register`, { deptName: deptForm.deptName })
      showAlert('success', '팀이 추가됐습니다.')
    } else {
      if (!deptForm.name) return showAlert('danger', '팀 이름을 입력해주세요.')
      await axios.post(`${API}/departments`, { deptId: deptForm.deptId, name: deptForm.name })
      showAlert('success', '팀 이름이 변경됐습니다.')
    }
    showDeptModal.value = false
    await fetchDepartments()
  } catch (e) {
    const msg = e.response?.data?.detail ?? e.response?.data?.message ?? '저장 중 오류가 발생했습니다.'
    showAlert('danger', typeof msg === 'string' ? msg : '저장 중 오류가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}

// ─── User Document Permissions ────────────────────────────────
const showUserPermModal = ref(false)
const permModalUser = ref(null)
const userDocs = ref([])
const userDocsLoading = ref(false)
const userDocsError = ref(false)

const openUserPerm = async (user) => {
  permModalUser.value = user
  userDocs.value = []
  userDocsError.value = false
  showUserPermModal.value = true
  userDocsLoading.value = true
  try {
    const { data } = await axios.post(`${API}/users/documents`, { email: user.email })
    const raw = unwrap(data)
    userDocs.value = Array.isArray(raw) ? raw : []
  } catch {
    userDocsError.value = true
  } finally {
    userDocsLoading.value = false
  }
}

// ─── Document Permissions API ─────────────────────────────────
const fetchDocPermissions = async () => {
  try {
    const { data } = await axios.get(`${API}/documents/departments/all`)
    const raw = unwrap(data)
    docPermissions.value = Array.isArray(raw) ? raw : []
  } catch {
    showAlert('danger', '문서 권한 목록을 불러오지 못했습니다.')
  }
}

const openAddPerm = (fileName = '') => {
  Object.assign(permForm, { fileName, deptId: '' })
  showPermModal.value = true
}

const savePerm = async () => {
  if (!permForm.fileName || !permForm.deptId) return showAlert('danger', '파일명과 팀을 선택해주세요.')
  isLoading.value = true
  try {
    await axios.post(`${API}/documents/permission`, { fileName: permForm.fileName, deptId: permForm.deptId })
    showAlert('success', '권한이 추가됐습니다.')
    showPermModal.value = false
    await fetchDocPermissions()
  } catch {
    showAlert('danger', '권한 추가 중 오류가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}

const removePerm = async (fileName, deptId) => {
  if (!confirm('이 권한을 해제하시겠습니까?')) return
  try {
    await axios.post(`${API}/documents/permission/remove`, { fileName, deptId })
    showAlert('success', '권한이 해제됐습니다.')
    await fetchDocPermissions()
  } catch {
    showAlert('danger', '권한 해제 중 오류가 발생했습니다.')
  }
}

const getDeptName = (deptId) => {
  return departments.value.find(d => d.id === deptId)?.name || deptId
}
</script>

<template>
  <div class="admin-root d-flex flex-column h-100 position-relative overflow-hidden">

    <!-- 애니메이션 배경 (HomeView·UploadView와 동일) -->
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

    <!-- 고정 상단 네비게이션 (항상 표시) -->
    <header class="page-topbar d-flex justify-content-between align-items-center px-4 py-3" style="z-index: 10;">
      <div class="d-flex align-items-center gap-3 logo-home" @click="router.push('/')" role="button" title="홈으로">
        <img src="/HNIX-CI.png" alt="HNIX" style="height: 22px; filter: brightness(0) invert(1); opacity: 0.9;" />
        <div class="d-flex align-items-center gap-2">
          <span class="fw-bold text-white fs-5">HNIX MATE</span>
          <span class="admin-badge">
            <i class="bi bi-shield-lock-fill me-1"></i>관리자
          </span>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span v-if="isLoggedIn" class="admin-user-chip d-none d-md-flex align-items-center gap-1">
          <i class="bi bi-person-circle"></i>
          <span>{{ currentUser?.name }}</span>
          <span class="opacity-75 small">({{ currentUser?.deptName }})</span>
        </span>
        <button v-if="isLoggedIn" class="btn btn-sm admin-logout-btn rounded-pill px-3" @click="doLogout">
          <i class="bi bi-box-arrow-right me-1"></i> 로그아웃
        </button>
      </div>
    </header>

    <!-- ══════════════════════ 로그인/회원가입 화면 ══════════════════════ -->
    <div v-if="!isLoggedIn" class="d-flex align-items-center justify-content-center flex-grow-1 p-4" style="z-index: 2; overflow-y: auto;">
      <div class="card shadow-lg border-0 glass-card auth-card">

        <!-- 카드 헤더 -->
        <div class="card-header bg-transparent border-bottom border-light p-4">
          <div class="d-flex align-items-center gap-2">
            <h5 class="mb-0 fw-bold text-primary-ci">로그인 / 회원가입</h5>
          </div>
        </div>

        <div class="card-body p-4">

          <!-- 전환 탭 -->
          <ul class="nav nav-pills nav-fill mb-4">
            <li class="nav-item">
              <button class="nav-link" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">
                <i class="bi bi-box-arrow-in-right me-1"></i> 로그인
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">
                <i class="bi bi-person-plus me-1"></i> 회원가입
              </button>
            </li>
          </ul>

          <!-- 알림 -->
          <div v-if="alert.show" :class="`alert alert-${alert.type} py-2`" role="alert">
            {{ alert.text }}
          </div>

          <!-- 로그인 폼 -->
          <form v-if="authMode === 'login'" @submit.prevent="doLogin">
            <div class="mb-3">
              <label class="form-label fw-semibold">이메일</label>
              <input v-model="loginForm.email" type="email" class="form-control" placeholder="name@company.com" required />
            </div>
            <div class="mb-4">
              <label class="form-label fw-semibold">비밀번호</label>
              <input v-model="loginForm.password" type="password" class="form-control" placeholder="비밀번호 입력" required />
            </div>
            <button type="submit" class="btn btn-primary-ci w-100 fw-bold" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              로그인
            </button>
          </form>

          <!-- 회원가입 폼 -->
          <form v-else @submit.prevent="doRegister">
            <div class="row g-3 mb-3">
              <div class="col-12">
                <label class="form-label fw-semibold">이메일 <span class="text-danger">*</span></label>
                <input v-model="registerForm.email" type="email" class="form-control" placeholder="name@company.com" required />
              </div>
              <div class="col-6">
                <label class="form-label fw-semibold">이름 <span class="text-danger">*</span></label>
                <input v-model="registerForm.name" type="text" class="form-control" placeholder="홍길동" required />
              </div>
              <div class="col-6">
                <label class="form-label fw-semibold">연락처</label>
                <input v-model="registerForm.phone" type="text" class="form-control" placeholder="010-0000-0000" />
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">비밀번호 <span class="text-danger">*</span></label>
                <input v-model="registerForm.password" type="password" class="form-control" placeholder="비밀번호 입력" required />
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">소속 팀 <span class="text-danger">*</span></label>
                <select v-model="registerForm.deptId" class="form-select" required>
                  <option value="">팀을 선택하세요</option>
                  <option v-for="d in departments" :key="d.name" :value="d.id" :disabled="!d.id">{{ d.name }}{{ !d.id ? " (준비 중)" : "" }}</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn btn-primary-ci w-100 fw-bold" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              회원가입
            </button>
          </form>

        </div>
      </div>
    </div>

    <!-- ══════════════════════ 관리자 대시보드 ══════════════════════ -->
    <div v-else class="d-flex flex-column flex-grow-1 overflow-hidden" style="z-index: 2;">

      <!-- 대시보드 서브타이틀 바 -->
      <div class="dashboard-subbar px-4 py-2 border-bottom d-flex align-items-center">
        <i class="bi bi-grid-1x2 me-2 text-primary-ci"></i>
        <span class="fw-semibold text-muted small">관리 대시보드</span>
      </div>

      <!-- 바디 (사이드바 + 컨텐츠) -->
      <div class="d-flex flex-grow-1 overflow-hidden">

        <!-- 사이드바 -->
        <nav class="admin-sidebar d-flex flex-column py-3 px-2">
          <button
            v-for="item in [
              { key: 'users', icon: 'bi-people', label: '사용자 관리' },
              { key: 'teams', icon: 'bi-diagram-3', label: '팀 관리' },
              { key: 'permissions', icon: 'bi-file-earmark-lock', label: '문서 권한' }
            ]"
            :key="item.key"
            class="sidebar-btn btn text-start mb-1 d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            :class="{ active: activeMenu === item.key }"
            @click="activeMenu = item.key"
          >
            <i :class="`bi ${item.icon}`"></i>
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <!-- 메인 컨텐츠 -->
        <main class="flex-grow-1 overflow-auto p-4">

          <!-- 전역 알림 -->
          <div v-if="alert.show" :class="`alert alert-${alert.type} py-2 mb-3`" role="alert">
            {{ alert.text }}
          </div>

          <!-- ── 사용자 관리 ── -->
          <section v-if="activeMenu === 'users'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0"><i class="bi bi-people me-2 text-primary-ci"></i>사용자 관리</h5>
              <button class="btn btn-primary-ci btn-sm px-3 rounded-pill" @click="openAddUser">
                <i class="bi bi-person-plus me-1"></i> 사용자 추가
              </button>
            </div>

            <div class="mb-3">
              <input v-model="userSearch" type="text" class="form-control" placeholder="이름 또는 이메일로 검색..." />
            </div>

            <div class="card border-0 shadow-sm glass-card-light">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>이름</th>
                      <th>이메일</th>
                      <th>소속 팀</th>
                      <th>연락처</th>
                      <th class="text-center">권한</th>
                      <th class="text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="filteredUsers.length === 0">
                      <td colspan="7" class="text-center text-muted py-4">사용자가 없습니다.</td>
                    </tr>
                    <tr v-for="user in filteredUsers" :key="user.email">
                      <td class="fw-semibold">
                        {{ user.name }}
                        <span v-if="user.isAdmin" class="badge bg-warning text-dark ms-1 small">관리자</span>
                      </td>
                      <td class="text-muted small">{{ user.email }}</td>
                      <td>
                        <span class="badge bg-primary-ci-light text-primary-ci rounded-pill px-2">
                          {{ user.deptName || '-' }}
                        </span>
                      </td>
                      <td class="text-muted small">{{ user.phone || '-' }}</td>
                      <td class="text-center">
                        <button class="btn btn-sm me-1 rounded-pill px-2"
                          :class="user.isAdmin ? 'btn-warning' : 'btn-outline-warning'"
                          @click="toggleAdmin(user)"
                          :title="user.isAdmin ? '관리자 권한 회수' : '관리자 권한 부여'">
                          <i class="bi bi-shield-lock"></i>
                        </button>
                      </td>
                      <td class="text-center">
                        <button class="btn btn-outline-primary btn-sm me-1 rounded-pill px-2" @click="openUserPerm(user)" title="접근 권한 확인">
                          <i class="bi bi-shield-check"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm me-1 rounded-pill px-2" @click="openEditUser(user)" title="정보 수정">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm rounded-pill px-2" @click="deleteUser(user.email)" title="삭제">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-footer bg-transparent text-muted small px-3 py-2">
                총 {{ filteredUsers.length }}명
              </div>
            </div>
          </section>

          <!-- ── 팀 관리 ── -->
          <section v-else-if="activeMenu === 'teams'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0"><i class="bi bi-diagram-3 me-2 text-primary-ci"></i>팀 관리</h5>
              <button class="btn btn-primary-ci btn-sm px-3 rounded-pill" @click="openAddDept">
                <i class="bi bi-plus-circle me-1"></i> 팀 추가
              </button>
            </div>

            <div class="row g-3">
              <div v-if="departments.length === 0" class="col-12 text-center text-muted py-5">
                등록된 팀이 없습니다.
              </div>
              <div v-for="dept in departments" :key="dept.id" class="col-12 col-sm-6 col-lg-4">
                <div class="card border-0 shadow-sm glass-card-light h-100">
                  <div class="card-body d-flex align-items-center justify-content-between">
                    <div>
                      <div class="fw-bold">{{ dept.name }}</div>
                      <div class="text-muted small mt-1">
                        <i class="bi bi-people me-1"></i>{{ dept.memberCount ?? 0 }}명
                      </div>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" @click="openEditDept(dept)">
                      <i class="bi bi-pencil me-1"></i> 수정
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ── 문서 권한 관리 ── -->
          <section v-else-if="activeMenu === 'permissions'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0"><i class="bi bi-file-earmark-lock me-2 text-primary-ci"></i>문서 권한 관리</h5>
              <button class="btn btn-primary-ci btn-sm px-3 rounded-pill" @click="openAddPerm()">
                <i class="bi bi-plus-circle me-1"></i> 권한 추가
              </button>
            </div>

            <div class="mb-3">
              <input v-model="docSearch" type="text" class="form-control" placeholder="파일명으로 검색..." />
            </div>

            <div class="d-flex flex-column gap-3">
              <div v-if="filteredDocs.length === 0" class="text-center text-muted py-5">
                문서 권한 데이터가 없습니다.
              </div>
              <div v-for="doc in filteredDocs" :key="doc.fileName" class="card border-0 shadow-sm glass-card-light">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="fw-semibold text-dark" style="word-break: break-all;">
                      <i class="bi bi-file-earmark-text me-2 text-primary-ci"></i>{{ doc.fileName }}
                    </div>
                    <button class="btn btn-outline-primary btn-sm rounded-pill px-3 ms-2 flex-shrink-0"
                            @click="openAddPerm(doc.fileName)">
                      <i class="bi bi-plus me-1"></i> 팀 추가
                    </button>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <span v-if="!doc.deptIds || doc.deptIds.length === 0" class="text-muted small">
                      접근 가능한 팀 없음
                    </span>
                    <span
                      v-for="deptId in (doc.deptIds || [])"
                      :key="deptId"
                      class="badge dept-badge d-flex align-items-center gap-1 px-2 py-1"
                    >
                      {{ getDeptName(deptId) }}
                      <button class="btn-close-badge" @click="removePerm(doc.fileName, deptId)" title="권한 해제">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>

    <!-- ══════════════════════ 모달: 사용자 추가/수정 ══════════════════════ -->
    <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal = false">
      <div class="modal-card card border-0 shadow-lg">
        <div class="card-header bg-transparent border-bottom fw-bold py-3">
          <i class="bi bi-person me-2 text-primary-ci"></i>
          {{ userModalMode === 'add' ? '사용자 추가' : '사용자 정보 수정' }}
        </div>
        <div class="card-body p-4">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label fw-semibold">이메일 <span class="text-danger">*</span></label>
              <input v-model="userForm.email" type="email" class="form-control" :disabled="userModalMode === 'edit'" placeholder="name@company.com" />
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold">이름 <span class="text-danger">*</span></label>
              <input v-model="userForm.name" type="text" class="form-control" placeholder="홍길동" />
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold">연락처</label>
              <input v-model="userForm.phone" type="text" class="form-control" placeholder="010-0000-0000" />
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">소속 팀 <span class="text-danger">*</span></label>
              <select v-model="userForm.deptId" class="form-select">
                <option value="">팀을 선택하세요</option>
                <option v-for="d in departments" :key="d.name" :value="d.id" :disabled="!d.id">{{ d.name }}{{ !d.id ? " (준비 중)" : "" }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="card-footer bg-transparent d-flex justify-content-end gap-2 py-3">
          <button class="btn btn-outline-secondary rounded-pill px-4" @click="showUserModal = false">취소</button>
          <button class="btn btn-primary-ci rounded-pill px-4 fw-semibold" @click="saveUser" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════ 모달: 팀 추가/수정 ══════════════════════ -->
    <div v-if="showDeptModal" class="modal-overlay" @click.self="showDeptModal = false">
      <div class="modal-card card border-0 shadow-lg">
        <div class="card-header bg-transparent border-bottom fw-bold py-3">
          <i class="bi bi-diagram-3 me-2 text-primary-ci"></i>
          {{ deptModalMode === 'add' ? '팀 추가' : '팀 이름 수정' }}
        </div>
        <div class="card-body p-4">
          <label class="form-label fw-semibold">
            {{ deptModalMode === 'add' ? '새 팀 이름' : '변경할 팀 이름' }}
            <span class="text-danger">*</span>
          </label>
          <input
            v-if="deptModalMode === 'add'"
            v-model="deptForm.deptName"
            type="text"
            class="form-control"
            placeholder="팀 이름 입력"
          />
          <input
            v-else
            v-model="deptForm.name"
            type="text"
            class="form-control"
            placeholder="팀 이름 입력"
          />
        </div>
        <div class="card-footer bg-transparent d-flex justify-content-end gap-2 py-3">
          <button class="btn btn-outline-secondary rounded-pill px-4" @click="showDeptModal = false">취소</button>
          <button class="btn btn-primary-ci rounded-pill px-4 fw-semibold" @click="saveDept" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════ 모달: 문서 권한 추가 ══════════════════════ -->
    <div v-if="showPermModal" class="modal-overlay" @click.self="showPermModal = false">
      <div class="modal-card card border-0 shadow-lg">
        <div class="card-header bg-transparent border-bottom fw-bold py-3">
          <i class="bi bi-file-earmark-lock me-2 text-primary-ci"></i> 문서 권한 추가
        </div>
        <div class="card-body p-4">
          <div class="mb-3">
            <label class="form-label fw-semibold">파일명 <span class="text-danger">*</span></label>
            <input v-model="permForm.fileName" type="text" class="form-control" placeholder="파일명 입력" />
          </div>
          <div>
            <label class="form-label fw-semibold">접근 허용 팀 <span class="text-danger">*</span></label>
            <select v-model="permForm.deptId" class="form-select">
              <option value="">팀을 선택하세요</option>
              <option v-for="d in departments" :key="d.name" :value="d.id" :disabled="!d.id">{{ d.name }}{{ !d.id ? " (준비 중)" : "" }}</option>
            </select>
          </div>
        </div>
        <div class="card-footer bg-transparent d-flex justify-content-end gap-2 py-3">
          <button class="btn btn-outline-secondary rounded-pill px-4" @click="showPermModal = false">취소</button>
          <button class="btn btn-primary-ci rounded-pill px-4 fw-semibold" @click="savePerm" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            추가
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════ 모달: 사용자 접근 권한 ══════════════════════ -->
    <div v-if="showUserPermModal" class="modal-overlay" @click.self="showUserPermModal = false">
      <div class="modal-card card border-0 shadow-lg" style="max-width: 560px;">
        <div class="card-header bg-transparent border-bottom py-3">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-shield-check text-primary-ci fs-5"></i>
              <span class="fw-bold">접근 가능 문서</span>
            </div>
            <button class="btn-close" @click="showUserPermModal = false"></button>
          </div>
          <!-- 유저 정보 요약 -->
          <div class="d-flex align-items-center gap-2 mt-2">
            <div class="user-avatar-sm">{{ (permModalUser?.name || '?')[0].toUpperCase() }}</div>
            <div>
              <span class="fw-semibold">{{ permModalUser?.name }}</span>
              <span class="text-muted small ms-1">{{ permModalUser?.email }}</span>
            </div>
            <span class="badge bg-primary-ci-light text-primary-ci rounded-pill ms-auto">
              {{ permModalUser?.deptName || '-' }}
            </span>
          </div>
        </div>

        <div class="card-body p-3" style="max-height: 420px; overflow-y: auto;">
          <!-- 로딩 -->
          <div v-if="userDocsLoading" class="text-center py-5">
            <div class="spinner-border text-primary-ci"></div>
            <div class="text-muted small mt-2">불러오는 중...</div>
          </div>

          <!-- 오류 -->
          <div v-else-if="userDocsError" class="text-center py-5 text-muted">
            <i class="bi bi-exclamation-circle fs-3 d-block mb-2 text-warning"></i>
            문서 목록을 불러오지 못했습니다.
          </div>

          <!-- 빈 상태 -->
          <div v-else-if="userDocs.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-folder2-open fs-3 d-block mb-2"></i>
            접근 가능한 문서가 없습니다.<br>
            <span class="small">소속 팀에 문서 권한을 부여해 주세요.</span>
          </div>

          <!-- 문서 목록 -->
          <div v-else class="d-flex flex-column gap-2">
            <div class="d-flex align-items-center justify-content-between px-2 py-1 border-bottom mb-1">
              <span class="small fw-semibold text-muted">파일명</span>
              <span class="badge bg-secondary rounded-pill">{{ userDocs.length }}개</span>
            </div>
            <div
              v-for="doc in userDocs"
              :key="doc.fileName ?? doc"
              class="d-flex align-items-center gap-2 p-2 rounded-3 doc-row"
            >
              <i class="bi bi-file-earmark-text text-primary-ci flex-shrink-0"></i>
              <span class="small text-break">{{ doc.fileName ?? doc }}</span>
            </div>
          </div>
        </div>

        <div class="card-footer bg-transparent border-top py-2 px-3">
          <p class="small text-muted mb-0">
            <i class="bi bi-info-circle me-1"></i>
            문서 접근 권한은 <strong>팀 단위</strong>로 관리됩니다.
            권한 변경은 <strong>문서 권한 관리</strong> 탭에서 할 수 있습니다.
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── 배경 (HomeView·UploadView와 동일) ── */
.animated-background {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  overflow: hidden;
  z-index: 1;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 33%, #bbdefb 66%, #e0f7fa 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.floating-icon {
  position: absolute;
  font-size: 2rem;
  color: var(--ci-primary);
  opacity: 0.15;
  animation: float 20s infinite ease-in-out;
}

.floating-icon:nth-child(even) { color: var(--ci-secondary); opacity: 0.12; }

.icon-1  { top: 10%; left: 10%;  font-size: 3rem;   animation-duration: 18s; animation-delay: 0s; }
.icon-2  { top: 20%; right: 15%; font-size: 2.5rem;  animation-duration: 22s; animation-delay: 2s; }
.icon-3  { top: 60%; left: 8%;   font-size: 2.8rem;  animation-duration: 20s; animation-delay: 4s; }
.icon-4  { top: 70%; right: 10%; font-size: 2.2rem;  animation-duration: 19s; animation-delay: 1s; }
.icon-5  { top: 40%; left: 20%;  font-size: 2.6rem;  animation-duration: 21s; animation-delay: 3s; }
.icon-6  { top: 15%; left: 50%;  font-size: 2.4rem;  animation-duration: 23s; animation-delay: 5s; }
.icon-7  { top: 80%; left: 30%;  font-size: 2.7rem;  animation-duration: 17s; animation-delay: 2.5s; }
.icon-8  { top: 50%; right: 25%; font-size: 2.3rem;  animation-duration: 24s; animation-delay: 1.5s; }
.icon-9  { top: 30%; right: 5%;  font-size: 2.9rem;  animation-duration: 19s; animation-delay: 4.5s; }
.icon-10 { top: 85%; right: 40%; font-size: 2.5rem;  animation-duration: 22s; animation-delay: 3.5s; }
.icon-11 { top: 5%;  right: 40%; font-size: 2.2rem;  animation-duration: 20s; animation-delay: 1.5s; }
.icon-12 { top: 25%; left: 35%;  font-size: 2.7rem;  animation-duration: 18s; animation-delay: 0.5s; }
.icon-13 { top: 75%; right: 20%; font-size: 3.1rem;  animation-duration: 25s; animation-delay: 2s; }
.icon-14 { top: 45%; right: 45%; font-size: 2.4rem;  animation-duration: 21s; animation-delay: 4s; }
.icon-15 { top: 65%; left: 45%;  font-size: 2.6rem;  animation-duration: 23s; animation-delay: 1s; }
.icon-16 { top: 35%; left: 5%;   font-size: 2.3rem;  animation-duration: 19s; animation-delay: 3s; }
.icon-17 { top: 90%; left: 15%;  font-size: 2.8rem;  animation-duration: 24s; animation-delay: 5s; }
.icon-18 { top: 55%; left: 65%;  font-size: 2.5rem;  animation-duration: 17s; animation-delay: 2.5s; }
.icon-19 { top: 15%; right: 30%; font-size: 2.9rem;  animation-duration: 22s; animation-delay: 4.5s; }
.icon-20 { top: 85%; right: 5%;  font-size: 2.4rem;  animation-duration: 20s; animation-delay: 3.5s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.15; }
  25%       { transform: translate(20px, -30px) rotate(5deg); opacity: 0.25; }
  50%       { transform: translate(-15px, -50px) rotate(-5deg); opacity: 0.2; }
  75%       { transform: translate(25px, -20px) rotate(3deg); opacity: 0.22; }
}

/* ── 로그인 카드 ── */
.auth-card {
  width: 100%;
  max-width: 480px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* ── 글래스 카드 (공통) ── */
.glass-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
}

.glass-card-light {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
}

/* ── 고정 상단 네비 ── */
.page-topbar {
  background: linear-gradient(135deg, #2c3e50 0%, #37474f 100%);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.logo-home {
  cursor: pointer;
  transition: opacity 0.2s;
}

.logo-home:hover {
  opacity: 0.75;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(77, 182, 172, 0.25);
  border: 1px solid rgba(77, 182, 172, 0.5);
  color: #80cbc4;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 10px;
  border-radius: 12px;
}

.admin-user-chip {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 3px 12px;
}

.admin-home-btn {
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.admin-home-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.7);
  color: white;
}

.admin-logout-btn {
  border: 1.5px solid rgba(229, 115, 115, 0.6);
  color: #ef9a9a;
  font-weight: 600;
  background: rgba(229, 115, 115, 0.1);
  transition: all 0.2s ease;
}

.admin-logout-btn:hover {
  background: rgba(229, 115, 115, 0.25);
  border-color: #ef9a9a;
  color: #ffcdd2;
}

.dashboard-subbar {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* ── 상단 헤더 (레거시 유지) ── */
.admin-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

/* ── 사이드바 ── */
.admin-sidebar {
  width: 200px;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.07);
  z-index: 5;
}

.sidebar-btn {
  color: #546e7a;
  font-weight: 500;
  border: none;
  background: transparent;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.sidebar-btn:hover {
  background: rgba(77, 182, 172, 0.1);
  color: var(--ci-primary);
}

.sidebar-btn.active {
  background: rgba(77, 182, 172, 0.15);
  color: var(--ci-primary);
  font-weight: 700;
}

/* ── 버튼 ── */
.btn-primary-ci {
  background-color: var(--ci-primary);
  border-color: var(--ci-primary);
  color: white;
  transition: all 0.2s ease;
}

.btn-primary-ci:hover {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.btn-primary-ci:disabled {
  background-color: var(--ci-primary);
  opacity: 0.7;
}

/* ── 뱃지 ── */
.bg-primary-ci-light { background-color: rgba(77, 182, 172, 0.12) !important; }

.dept-badge {
  background: rgba(77, 182, 172, 0.15);
  color: var(--ci-primary);
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 20px;
  border: 1px solid rgba(77, 182, 172, 0.3);
}

.btn-close-badge {
  background: none;
  border: none;
  padding: 0;
  color: var(--ci-primary);
  cursor: pointer;
  font-size: 0.6rem;
  opacity: 0.7;
  line-height: 1;
}

.btn-close-badge:hover { opacity: 1; }

/* ── 모달 오버레이 ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  background: white;
  animation: modalIn 0.25s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── 사용자 권한 모달 ── */
.user-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ci-primary);
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.doc-row {
  background: rgba(77, 182, 172, 0.06);
  border: 1px solid rgba(77, 182, 172, 0.15);
  transition: background 0.15s;
}

.doc-row:hover {
  background: rgba(77, 182, 172, 0.14);
}

/* ── nav pills 커스텀 ── */
.nav-pills .nav-link.active {
  background-color: var(--ci-primary);
}

.nav-pills .nav-link {
  color: #546e7a;
  font-weight: 600;
}

.nav-pills .nav-link:not(.active):hover {
  color: var(--ci-primary);
  background-color: rgba(77, 182, 172, 0.08);
}

/* ── 테이블 ── */
.table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #78909c;
  font-weight: 700;
}
</style>

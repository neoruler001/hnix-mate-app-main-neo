import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UploadView from '../views/UploadView.vue'
import AdminView from '../views/AdminView.vue'
import HnLLMView from '../views/HnLLMView.vue'
import MllmView from '../views/MllmView.vue'

const router = createRouter({
  history: createWebHistory('/lab1/hnix-mate-app/'),
  routes: [
    {
      path: '/',
      component: HomeView,
      name: 'Home'
    },
    {
      path: '/upload',
      component: UploadView,
      name: 'Upload'
    },
    {
      path: '/admin',
      component: AdminView,
      name: 'Admin',
      meta: { requiresAdmin: true }
    },
    {
      path: '/hnllm',
      component: HnLLMView,
      name: 'HnLLM'
    },
    {
      path: '/mllm',
      component: MllmView,
      name: 'Mllm'
    },
    // 기타 모든 경로는 홈으로 리다이렉트
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// 라우트 가드: 관리자 권한 확인
router.beforeEach((to, from, next) => {
  // /admin 페이지에 대한 관리자 권한 확인
  if (to.meta.requiresAdmin) {
    try {
      const stored = localStorage.getItem('hnix_user')
      const currentUser = stored ? JSON.parse(stored) : null

      if (!currentUser || !currentUser.isAdmin) {
        // 관리자가 아닌 경우: 홈으로 리다이렉트 + 메시지 표시
        sessionStorage.setItem('accessDeniedMessage', '접근 권한이 없습니다.')
        next({ name: 'Home' })
        return
      }
    } catch (e) {
      // 파싱 오류 시 홈으로 리다이렉트
      sessionStorage.setItem('accessDeniedMessage', '접근 권한이 없습니다.')
      next({ name: 'Home' })
      return
    }
  }

  next()
})

export default router

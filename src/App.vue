<template>
  <div id="app-root" class="h-100">
    <RouterView />

    <!-- 전역 에러 모달 -->
    <ErrorModal
      :is-visible="isVisible"
      :error-title="errorTitle"
      :error-message="errorMessage"
      :error-details="errorDetails"
      :show-retry="showRetry"
      @close="hideError"
      @retry="handleRetry"
    />
  </div>
</template>

<script setup>
import ErrorModal from './components/common/ErrorModal.vue'
import { useErrorModal } from './composables/useErrorModal'

const {
  isVisible,
  errorTitle,
  errorMessage,
  errorDetails,
  showRetry,
  hideError,
  handleRetry
} = useErrorModal()
</script>

<style>
/* Global Layout Fixes */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

#app-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Page Transition Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>

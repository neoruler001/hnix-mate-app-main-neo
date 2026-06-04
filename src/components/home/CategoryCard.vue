<template>
  <div class="card h-100 shadow-sm border-0 category-card" @click="$emit('select', title)">
    <div class="card-body text-center d-flex flex-column align-items-center justify-content-center">
      <div class="icon-wrapper mb-3 rounded-circle d-flex align-items-center justify-content-center">
        <i :class="`bi ${icon} fs-2 text-primary-ci`"></i>
      </div>
      <h6 class="card-title fw-bold mb-0">{{ title }}</h6>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
})
defineEmits(['select'])
</script>

<style scoped>
.category-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  background: rgba(255, 255, 255, 1) !important; /* 조금 더 투명하게 */
  backdrop-filter: blur(10px); /* 블러 효과 증가 */
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.category-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 1rem 2.5rem rgba(25, 58, 148, 0.08)!important;
  background: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(19, 156, 69, 0.7);
}

.icon-wrapper {
  width: 65px;
  height: 65px;
  background-color: rgba(19, 156, 69, 0.06); /* 부드러운 녹색 */
  border-radius: 18px !important;
  transition: all 0.3s ease;
}

.category-card:hover .icon-wrapper {
  background-color: rgba(25, 58, 148, 0.1); /* 호버 시 파란색 포인트 */
  transform: rotate(5deg) scale(1.1);
}

.card-title {
  color: var(--ci-primary);
  opacity: 0.9;
}
</style>

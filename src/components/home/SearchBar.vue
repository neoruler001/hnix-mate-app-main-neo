<template>
  <div class="search-bar-container w-100">
    <div class="input-group shadow-sm">
      <span class="input-group-text bg-white border-0">
        <i class="bi bi-search search-icon"></i>
      </span>
      <input
        type="text"
        class="form-control border-0 px-1"
        placeholder="무엇이든 물어보세요 (예: 휴가 규정, 연차 사용법)"
        v-model="query"
        @keyup.enter="onSearch"
        aria-label="Search"
      />
      <button class="btn send-btn border-0" type="button" @click="onSearch">
        <i class="bi bi-send-fill fs-5"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['search'])
const query = ref('')

const onSearch = () => {
  if (query.value.trim()) {
    emit('search', query.value.trim())
    query.value = ''
  }
}
</script>

<style scoped>
.search-bar-container {
  max-width: 800px;
  margin: 0 auto;
}

.input-group {
  border-radius: 50px;
  overflow: hidden;
  border: 1px solid rgba(77, 182, 172, 0.3);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s ease;
}

.input-group:focus-within {
  border-color: rgba(77, 182, 172, 0.6);
  box-shadow: 0 0.5rem 1.5rem rgba(77, 182, 172, 0.15) !important;
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.input-group-text {
  padding-left: 1.5rem;
  background: transparent !important;
}

.search-icon {
  color: var(--ci-primary);
  opacity: 0.8;
  font-size: 1.25rem;
}

.form-control {
  height: 60px;
  font-size: 1.1rem;
  background: transparent !important; /* 배경 투명 유지 */
  color: #2c3e50;
}

.form-control::placeholder {
  color: rgba(44, 62, 80, 0.5);
}

.form-control:focus {
  box-shadow: none;
}

.send-btn {
  width: 70px;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  color: white;
  transition: all 0.3s ease;
}

.send-btn:hover {
  background: linear-gradient(135deg, #26a69a 0%, #00897b 100%);
  transform: scale(1.05);
}

.send-btn:active {
  transform: scale(0.98);
}
</style>

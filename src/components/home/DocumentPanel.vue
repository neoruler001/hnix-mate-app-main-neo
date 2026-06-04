<template>
  <div class="document-panel bg-white border-start h-100 p-3 shadow-sm">
    <h5 class="fw-bold mb-3 text-secondary-ci">
      <i class="bi bi-file-earmark-text me-2"></i> 관련 문서 & 규정
    </h5>
    
    <div v-if="documents.length === 0" class="text-muted text-center py-5">
      <i class="bi bi-inbox fs-1 d-block mb-2"></i>
      관련된 문서가 없습니다.
    </div>

    <div class="list-group list-group-flush">
      <a 
        v-for="(doc, index) in documents" 
        :key="index" 
        :href="doc.url" 
        target="_blank"
        class="list-group-item list-group-item-action border-0 mb-2 rounded bg-light"
      >
        <div class="d-flex w-100 justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <i class="bi bi-file-pdf text-danger fs-4 me-3" v-if="doc.type === 'pdf'"></i>
            <i class="bi bi-link-45deg text-primary fs-4 me-3" v-else></i>
            <div>
              <h6 class="mb-0 fw-bold">{{ doc.title }}</h6>
              <small class="text-muted">{{ doc.description }}</small>
            </div>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  documents: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.document-panel {
  width: 350px;
  min-width: 300px;
}

.list-group-item:hover {
  background-color: #e9ecef !important;
}
</style>

<template>
  <div class="message-container d-flex mb-3" :class="isUser ? 'justify-content-end' : 'justify-content-start'" v-show="!message.isHidden">
    <div class="message-bubble p-3 shadow-sm" :class="isUser ? 'user-bubble' : 'bot-bubble'">
      <!-- Sender Name -->
      <div v-if="!isUser" class="fw-bold mb-1 text-primary-ci">
        <i class="bi bi-robot me-1"></i> HNIX 챗봇
      </div>

      <!-- Message Content: 봇 답변은 포맷팅된 HTML로, 사용자 입력은 일반 텍스트로 -->
      <div class="message-content" v-if="!isUser" v-html="formattedText"></div>
      <div class="message-content" v-else style="white-space: pre-wrap;">{{ message.text }}</div>

      <!-- 출처 파일 목록 + 연관도 그래프 -->
      <div v-if="!isUser && (message.sources || message.supplementalContext)" class="mt-2 pt-2 border-top">
        <!-- 출처 파일 -->
        <div v-if="message.sources && message.sources.length > 0" class="mb-2">
          <div class="sources-label mb-1">
            <i class="bi bi-paperclip me-1"></i><span class="fw-semibold">출처 파일</span>
          </div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <button
              v-for="src in message.sources"
              :key="src.fileName"
              class="btn btn-source btn-sm rounded-pill"
              @click="handleDownload(src.fileName)"
              :disabled="downloading === src.fileName"
            >
              <span v-if="downloading === src.fileName" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-file-earmark-arrow-down me-1"></i>
              {{ src.fileName }}
            </button>
            <!-- 연관도 그래프 보기 버튼 -->
            <button
              v-if="message.supplementalContext && message.supplementalContext.length > 0"
              class="btn btn-graph btn-sm rounded-pill"
              @click="showGraphModal = true"
              title="Neo4j 연관도 그래프 보기"
            >
              <i class="bi bi-diagram-3 me-1"></i> 연관도
            </button>
          </div>
        </div>
        <!-- 연관도만 있는 경우 -->
        <div v-else-if="message.supplementalContext && message.supplementalContext.length > 0">
          <button
            class="btn btn-graph btn-sm rounded-pill"
            @click="showGraphModal = true"
            title="Neo4j 연관도 그래프 보기"
          >
            <i class="bi bi-diagram-3 me-1"></i> 연관도 그래프 보기
          </button>
        </div>
      </div>

      <!-- 연관도 그래프 모달 -->
      <div v-if="showGraphModal && message.supplementalContext" class="modal-overlay" @click="showGraphModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-diagram-3 me-2"></i>Neo4j 연관도 그래프
            </h5>
            <button type="button" class="btn-close" @click="showGraphModal = false"></button>
          </div>
          <div class="modal-body">
            <!-- Cytoscape 그래프 -->
            <div v-if="message.supplementalContext && message.supplementalContext.length > 0" class="graph-container">
              <div ref="cytoscapeContainer" class="cytoscape-canvas"></div>
              <div class="graph-legend">
                <div class="legend-item">
                  <span class="legend-dot main"></span>
                  <span>주요 문서</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot related"></span>
                  <span>연관 문서</span>
                </div>
              </div>
            </div>
            <div v-else class="text-muted">
              연관된 문서가 없습니다.
            </div>
          </div>
        </div>
      </div>

      <!-- Bot Actions -->
      <div v-if="!isUser" class="mt-2 border-top pt-2 d-flex justify-content-end">
        <button class="btn btn-sm btn-outline-success rounded-pill" @click="$emit('send-email', message)">
          <i class="bi bi-envelope me-1"></i> 답변 메일로 보내기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import cytoscape from 'cytoscape'
import fileDownloadWebhook from '../../webhook/fileDownloadWebhook.js'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const downloading = ref('')
const showGraphModal = ref(false)
const cytoscapeContainer = ref(null)
let cy = null

const handleDownload = async (fileName) => {
  downloading.value = fileName
  try {
    await fileDownloadWebhook(fileName)
  } catch {
    alert(`"${fileName}" 다운로드에 실패했습니다.`)
  } finally {
    downloading.value = ''
  }
}

const isUser = computed(() => props.message.sender === 'user')

/**
 * 텍스트에 포맷팅 규칙을 적용하여 HTML 문자열로 반환
 */
const formattedText = computed(() => {
  if (!props.message.text) return ''

  let text = props.message.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  text = text.replace(/\*{3}(.+?)\*{3}/gs, '<strong class="fmt-triple-star">$1</strong>')
  text = text.replace(/\*{2}(.+?)\*{2}/gs, '<strong class="fmt-double-star">$1</strong>')
  text = text.replace(/\*(.+?)\*/gs, '<strong>$1</strong>')
  text = text.replace(/(<[^>]+>)|"([^"]+)"/gs, (match, tag, quoted) => {
    if (tag) return tag;
    return `<strong>"${quoted}"</strong>`;
  })
  text = text.replace(/(<[^>]+>)|'([^']+)'/gs, (match, tag, quoted) => {
    if (tag) return tag;
    return `<em>'${quoted}'</em>`;
  })
  text = text.replace(/([.?!])(\s+|$)/gm, '$1<br>$2')
  text = text.replace(/\n/g, '<br>')

  return text
})

// 그래프 초기화 및 렌더링
const initializeGraph = async () => {
  await nextTick()

  if (!cytoscapeContainer.value || !props.message.supplementalContext) {
    return
  }

  const supplemental = props.message.supplementalContext || []

  // 노드 생성: 중앙의 "현재 문서" + 연관 문서들
  const nodes = [
    {
      data: { id: 'main', label: '현재 문서' },
      classes: 'main-node'
    }
  ]

  const edges = []

  // 각 보충 문서를 노드로 추가
  const uniqueSources = [...new Set(supplemental.map(doc => doc.source))]

  uniqueSources.forEach((source, index) => {
    const nodeId = `doc_${index}`
    const shortName = source.length > 30 ? source.substring(0, 27) + '...' : source

    nodes.push({
      data: { id: nodeId, label: shortName, fullName: source },
      classes: 'related-node'
    })

    edges.push({
      data: { source: 'main', target: nodeId }
    })
  })

  const elements = [...nodes, ...edges]

  cy = cytoscape({
    container: cytoscapeContainer.value,
    elements: elements,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#4db6ac',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'width': '80px',
          'height': '80px',
          'font-size': '12px',
          'color': '#fff',
          'text-wrap': 'wrap',
          'text-max-width': '70px',
          'border-width': '2px',
          'border-color': '#00897b',
          'padding': '10px'
        }
      },
      {
        selector: 'node.main-node',
        style: {
          'background-color': '#26a69a',
          'width': '100px',
          'height': '100px',
          'font-weight': 'bold',
          'font-size': '13px',
          'border-width': '3px'
        }
      },
      {
        selector: 'node.related-node',
        style: {
          'background-color': '#80cbc4',
          'width': '70px',
          'height': '70px',
          'font-size': '11px'
        }
      },
      {
        selector: 'edge',
        style: {
          'line-color': '#b2dfdb',
          'width': '2px',
          'target-arrow-color': '#4db6ac',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
    layout: {
      name: 'concentric',
      concentric: (node) => node.id() === 'main' ? 100 : 50,
      levelWidth: () => 100,
      minNodeSpacing: 80
    }
  })

  // 노드 호버 이벤트
  cy.on('mouseover', 'node', function(e) {
    const node = e.target
    if (node.data('fullName')) {
      node.style('label', node.data('fullName'))
    }
  })

  cy.on('mouseout', 'node', function(e) {
    const node = e.target
    node.style('label', node.data('label'))
  })

  // 컨테이너 크기 조정
  cy.resize()
  cy.fit()
}

// showGraphModal 변경 감지
watch(showGraphModal, (newVal) => {
  if (newVal) {
    initializeGraph()
  }
})

defineEmits(['send-email'])
</script>

<style scoped>
.message-bubble {
  max-width: 75%;
  border-radius: 12px;
  position: relative;
  animation: messageAppear 0.3s ease-out;
  transition: all 0.3s ease;
}

.user-bubble {
  background-color: var(--ci-primary);
  color: white;
  border-bottom-right-radius: 2px;
}

.bot-bubble {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #34495e;
  border-bottom-left-radius: 2px;
}

.message-content {
  line-height: 1.7;
}

.message-content :deep(.fmt-triple-star) {
  font-weight: 700;
  text-decoration: underline;
  font-size: 1.125em;
}

.message-content :deep(.fmt-double-star) {
  font-weight: 700;
  text-decoration: underline;
}

.message-content :deep(em) {
  font-style: italic;
}

.btn-outline-success {
  border-color: #4db6ac;
  border-width: 1.5px;
  color: #26a69a;
  font-weight: 600;
  font-size: 0.82rem;
  letter-spacing: 0.01em;
}

.btn-outline-success:hover {
  background-color: #4db6ac;
  border-color: #4db6ac;
  color: white;
  font-weight: 600;
}

.sources-label {
  font-size: 0.78rem;
  color: #78909c;
  letter-spacing: 0.03em;
}

.btn-source {
  font-size: 0.78rem;
  font-weight: 600;
  border: 1.5px solid rgba(77, 182, 172, 0.4);
  color: var(--ci-primary);
  background: rgba(77, 182, 172, 0.06);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-source:hover:not(:disabled) {
  background: var(--ci-primary);
  border-color: var(--ci-primary);
  color: white;
}

.btn-source:disabled {
  opacity: 0.6;
}

.btn-graph {
  font-size: 0.78rem;
  font-weight: 600;
  border: 1.5px solid rgba(77, 182, 172, 0.5);
  color: white;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  transition: all 0.2s ease;
}

.btn-graph:hover {
  background: linear-gradient(135deg, #26a69a 0%, #00897b 100%);
  border-color: #00897b;
  transform: scale(1.05);
}

/* 연관도 그래프 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ci-primary);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #000;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.graph-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 15px;
}

.cytoscape-canvas {
  flex: 1;
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
  border-radius: 8px;
  min-height: 350px;
  border: 1px solid #e0e0e0;
}

.graph-legend {
  display: flex;
  gap: 20px;
  padding: 10px 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.main {
  background-color: #26a69a;
}

.legend-dot.related {
  background-color: #80cbc4;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

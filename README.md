# HNIX Mate App

회사 챗봇 통합 웹 애플리케이션으로, 직원들이 회사 복리후생 및 규정에 대한 정보를 검색할 수 있는 서비스입니다.

## 🚀 주요 기능

- **메인 채팅 인터페이스**: 카테고리 바로가기와 함께 챗봇과 대화할 수 있는 인터페이스
- **문서 미리보기**: 채팅 중 참조된 문서를 실시간으로 확인할 수 있는 패널
- **파일 업로드**: 챗봇 학습을 위한 문서 업로드 기능
- **카테고리 검색**: 복리후생, 인사규정, IT 지원 등 주요 카테고리별 빠른 검색

## 🛠️ 기술 스택

- **프레임워크**: Vue 3 (Composition API with `<script setup>`)
- **빌드 도구**: Vite
- **UI 라이브러리**: Bootstrap 5
- **아이콘**: Bootstrap Icons
- **HTTP 클라이언트**: Axios

## 📁 프로젝트 구조

```
hnix-mate-app/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common           # 공통 컴포넌트
|   |   |   └── ErrorModal.vue    # 에러 모달
|   |   |── home             # HomeView에서 사용하는 컴포넌트
│   │   │   └── CategoryCard.vue  # 카테고리 카드
│   │   │   └── ChatWindow.vue    # 채팅 창
│   │   │   └── DocumentPanel.vue # 문서 미리보기 패널
│   │   │   └── EmailModal.vue    # 메일 발송 모달
│   │   │   └── MessageBubble.vue # 메시지 버블
│   │   │   └── SearchBar.vue     # 검색 바
│   ├── views/               # 페이지 뷰
│   │   ├── HomeView.vue          # 메인 채팅 페이지
│   │   └── UploadView.vue        # 파일 업로드 페이지
│   ├── composables/         # 컴보저블
│   │   ├── useErrorModal.js      # 에러 모달 컴포저블
│   ├── webhook/             # 웹훅 관련
│   │   └── chatbotwebhook.js     # 챗봇 웹훅 핸들러
│   │   └── fileUploadWebhook.js  # 파일 업로드 웹훅 핸들러
│   │   └── sendMailWebhook.js    # 메일 발송 웹훅 핸들러
│   ├── App.vue              # 루트 컴포넌트
│   └── main.js              # 애플리케이션 진입점
├── public/                  # 정적 파일
└── .env                     # 환경 변수
```

## 🔧 설치 및 실행

### 사전 요구사항
- Node.js 16.x 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 미리보기

```bash
npm run preview
```

## 🌐 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
VITE_APP_API_URL=your_api_base_url
VITE_APP_WEBHOOK_CHAT=your_webhook_url        # 챗봇 Webhook URL
VITE_APP_WEBHOOK_EMAIL=your_webhook_url       # 메일 발송 Webhook URL
VITE_APP_WEBHOOK_FILE_UPLOAD=your_webhook_url # File 업로드 Webhook URL
```

## 📝 개발 가이드

### 컴포넌트 개발
- Vue 3 Composition API와 `<script setup>` 문법을 사용합니다
- Bootstrap 5 클래스를 활용하여 스타일링합니다
- 재사용 가능한 컴포넌트는 `src/components/` 디렉토리에 작성합니다

### 코드 스타일
- ESLint 설정을 따릅니다
- Standard 스타일 가이드를 기반으로 합니다

## 🎨 디자인

- **테마**: 기업용 대시보드 스타일
- **색상**: 회사 CI 컬러 적용
- **레이아웃**: 반응형 디자인 (모바일/태블릿/데스크톱 지원)

## 📄 라이선스

Private

## 👥 기여

이 프로젝트는 내부 프로젝트입니다.

## 📞 문의

프로젝트 관련 문의사항은 개발팀에 연락해주세요.

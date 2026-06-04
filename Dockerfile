# 1. 빌드 스테이지 (Node.js 환경)
FROM node:20-alpine AS build-stage

# 작업 폴더 설정
WORKDIR /app

# 의존성 설치 (캐싱 활용을 위해 package.json 먼저 복사)
COPY package*.json ./
RUN npm install

# 소스 코드 전체 복사 및 빌드
COPY . .
RUN npm run build

# 2. 실행 스테이지 (Nginx 환경 - 백엔드 slim 이미지처럼 가벼운 구성)
FROM nginx:stable-alpine AS production-stage

# 빌드 스테이지에서 생성된 정적 파일(dist)만 Nginx 실행 폴더로 복사
# 만약 빌드 결과물 폴더명이 build라면 /app/build로 수정하세요.
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Nginx 포트 노출 (요청하신 9140:80 매핑의 내부 포트)
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
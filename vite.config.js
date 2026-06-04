import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  base: '/lab1/hnix-mate-app/',
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      // /api-proxy/* → FastAPI 백엔드 (49.50.131.163:8080, nginx 경유)
      '/api-proxy': {
        target: 'http://127.0.0.1:6100',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api-proxy/, ''),
      },
      // /n8n-proxy/* → n8n 워크플로우 (챗봇/파일업로드/이메일)
      '/n8n-proxy': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/n8n-proxy/, ''),
      }
    }
  },
  plugins: [
    vue(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
    },
  },
})

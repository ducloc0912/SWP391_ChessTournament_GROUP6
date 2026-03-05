import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // Cho phép truy cập từ domain ngrok dùng để VNPay redirect
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'nonsubjective-mayola-radiosymmetrical.ngrok-free.dev'
    ],
    // Cấu hình HMR/WebSocket qua ngrok để tránh lỗi kết nối WS
    hmr: {
      host: 'nonsubjective-mayola-radiosymmetrical.ngrok-free.dev',
      protocol: 'wss',
      clientPort: 443
    }
    // Nếu sau này bạn đổi link ngrok liên tục, có thể dùng allowedHosts: true
  }
})

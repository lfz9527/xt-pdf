import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


const resolve = (paths: string) => {
  return path.resolve(__dirname, paths)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve('src'),
    }
  },
  server: {
    port: 8086,
    open: true,
  }
})

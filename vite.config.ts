import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The team server sends a CSP with default-src 'self', so nothing may be inlined: fonts stay files.
export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0, cssCodeSplit: false },
  server: { proxy: { '/v1': 'http://127.0.0.1:4170' } },
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'] },
})

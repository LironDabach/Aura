import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, envDir, ['VITE_', ''])
  const nodeEnv = (env.NODE_ENV || 'development').toLowerCase()
  const scope = nodeEnv === 'production' ? 'PROD' : 'DEV'
  const getScopedValue = (key: string) => env[`${scope}_${key}`] || env[key]
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(getScopedValue('VITE_API_BASE_URL'))
    }
  }
})

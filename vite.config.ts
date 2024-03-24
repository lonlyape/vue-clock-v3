import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import compConfig from './vite.comp.config.ts'

// https://vitejs.dev/config/
export default defineConfig(({mode})=>{
  let config = {
    plugins: [vue()],
  }

  if (mode === 'comp'){
    config = {
      ...config,
      ...compConfig()
    }
  }

  return config
})

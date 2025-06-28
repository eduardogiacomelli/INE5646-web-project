import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/AA/AA14/', // Importante para assets serem carregados do subdiretório
  build: {
    outDir: '/var/www/html/AA/AA14' // Define o diretório de saída
  }
})

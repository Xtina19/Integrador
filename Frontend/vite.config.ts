import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const nm = (pkg: string) => path.resolve(__dirname, `node_modules/${pkg}`)

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Evita que Rollup pierda node_modules al seguir junctions hacia ../Modulos
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@compartido': path.resolve(__dirname, './src/compartido'),
      react: nm('react'),
      'react-dom': nm('react-dom'),
      'react-router-dom': nm('react-router-dom'),
      'lucide-react': nm('lucide-react'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
  },
})

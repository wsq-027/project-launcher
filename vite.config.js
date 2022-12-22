import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  root: './src/views/dashboard',
  plugins: [
    vue(),
    electron([
      {
        entry: 'main.js',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            sourcemap: isDev,
            minify: isProd,
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: Object.keys('dependencies' in pkg ? pkg.dependencies : {})
            },
          }
        },
      },
      {
        entry: 'src/clients/desktop/preload.js',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            sourcemap: isDev,
            minify: isProd,
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: Object.keys('dependencies' in pkg ? pkg.dependencies : {})
            },
          },
        },
      },
    ]),
    renderer({})
  ],
  server: (() => {
    const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
    return {
      host: url.hostname,
      port: +url.port
    }
  })(),
  clearScreen: false,
})
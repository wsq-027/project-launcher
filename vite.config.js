import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'
import { rmSync } from 'fs'

rmSync('dist-electron', { recursive: true, force: true })
rmSync('dist', { recursive: true, force: true })

export default defineConfig({
  root: './src/views',
  build: {
    emptyOutDir: true,
    outDir: path.join(__dirname, './dist'),
  },
  plugins: [
    vue(),
    electron([ //
      {
        entry: 'src/app/main.js',
        onstart(options) {
          options.startup()
        },
      },
      {
        entry: 'src/app/preload.js',
        onstart(options) {
          options.reload()
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
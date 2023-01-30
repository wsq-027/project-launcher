const { StringDecoder } = require('string_decoder')
const nodePty = require('node-pty')
const Emitter = require('events')
const { app } = require('electron');
const shellEnv = require('shell-env');

// Max duration to batch session data before sending it to the renderer process.
const BATCH_DURATION_MS = 16;

// Max size of a session data batch. Note that this value can be exceeded by ~4k
// (chunk sizes seem to be 4k at the most)
const BATCH_MAX_SIZE = 200 * 1024;

class DataBatcher extends Emitter {
  constructor() {
    super()
    this.decoder = new StringDecoder('utf8')
    this.data = ''
    /**
     * @type {NodeJS.Timeout?}
     */
    this.timeout = null
  }

  /**
   *
   * @param {Buffer} chunk
   */
  write(chunk) {
    if (this.data.length + chunk.length >= BATCH_MAX_SIZE) {
      if (this.timeout) {
        clearTimeout(this.timeout)
        this.timeout = null
      }
      this.flush()
    }

    this.data += this.decoder.write(chunk)

    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.timeout = null
        this.flush()
      }, BATCH_DURATION_MS)
    }
  }

  flush() {
    this.emit('flush', this.data)
    this.data = ''
  }
}

module.exports = class Session extends Emitter{
  constructor() {
    super()
    /**
     * @type {nodePty.IPty?}
     */
    this.pty = null
    this.batcher = new DataBatcher()
    this.ended = false

    this.batcher.on('flush', (data) => {
      console.log('[session] flush data', data.substring(0, 20))
      this.emit('data', data)
    })
  }

  async open(command, args, { rows, cols, cwd }) {
    cwd = cwd || (app.isPackaged ? process.resourcesPath + '/app.asar.unpacked' : app.getAppPath())
    const env = app.isPackaged ? await shellEnv() : process.env
    this.pty = nodePty.spawn(command, args, {
    // this.pty = nodePty.spawn('node', ['--version'], {
      rows,
      cols,
      cwd,
      env,
    })
    this.ended = false
    let isExitImmediately = true
    let errData = ''

    this.pty.onData((chunk) => {
      if (this.ended) {
        return
      }

      this.batcher.write(chunk)

      if (isExitImmediately) {
        errData += this.batcher.data
      }
    })

    await Promise.race([
      new Promise(r => setTimeout(() => {
        isExitImmediately = false
        r()
      }, 300)), // 等待一段时间后如果直接退出则认为是进程失败
      new Promise((r, reject) => {
        this.pty.onExit((e) => {
          this.ended = true
          if (isExitImmediately && e.exitCode != 0) {
            const err = new Error('[session] error ' + errData)
            console.error(err)
            reject(err)
          }
        })
      })
    ])

    this.pty.onExit((e) => {
      this.ended = true
      console.log('[session] exit', e)
      this.emit('exit')
    })

    console.log('[session] start', command, args)
  }

  write(data) {
    console.log('[session] input', data)

    if (this.pty) {
      this.pty.write(data)
    }
  }

  exit() {
    if (this.pty) {
      this.pty.kill()
    }
  }
}
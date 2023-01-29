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

module.exports = class Monit extends Emitter{
  constructor() {
    super()
    /**
     * @type {nodePty.IPty?}
     */
    this.pty = null
    this.batcher = new DataBatcher()
    this.ended = false

    this.batcher.on('flush', (data) => {
      console.log('[monit] flush data')
      this.emit('data', data)
    })
  }

  async open({ rows, cols, args }) {
    const cwd = (app.isPackaged ? process.resourcesPath + '/app.asar.unpacked' : app.getAppPath()) + '/node_modules/pm2/bin'
    const env = app.isPackaged ? await shellEnv() : process.env
    this.pty = nodePty.spawn('./pm2', args, {
    // this.pty = nodePty.spawn('node', ['--version'], {
      rows,
      cols,
      cwd,
      env,
    })
    this.ended = false

    this.pty.onData((chunk) => {
      if (this.ended) {
        return
      }

      this.batcher.write(chunk)
    })

    this.pty.onExit((e) => {
      console.log('[monit] exit', e)
      this.ended = true
      this.emit('exit')
    })

    console.log('[monit] start')
  }

  async _getEnv() {
    return shellEnv()
  }

  write(data) {
    console.log('[monit] input', data)

    if (this.pty) {
      this.pty.write(data)
    }
  }

  exit() {
    if (this.pty) {
      this.pty.kill()
    }

    this.emit('exit')
    this.ended = true
  }
}
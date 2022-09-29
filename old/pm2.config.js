const path = require('path')
const resolve = (dir) => path.resolve(__dirname, dir)

module.exports = {
  apps: [
    {
      name: 'server',
      script: './old/server.js',
      error_file: './logs/server_error.log',
      out_file: './logs/server_out.log',
      pid_file: './logs/server.pid',
    },
    {
      name: 'hospital(medical)',
      script: './bin/www',
      cwd: '../../work/zoe-health-hospital',
      error_file: resolve('./logs/hospital_error.log'),
      out_file: resolve('./logs/hospital_out.log'),
      pid_file: resolve('./logs/hospital.pid'),
      exec_mode: 'cluster',
    },
    {
      name: 'app',
      script: './bin/www',
      cwd: '../../work/zoe-health-app',
      error_file: resolve('./logs/app_error.log'),
      out_file: resolve('./logs/app_out.log'),
      pid_file: resolve('./logs/app.pid'),
      exec_mode: 'cluster',
    },
    {
      name: 'app-pay(pay)',
      script: './bin/www',
      cwd: '../../work/zoe-health-app-pay',
      error_file: resolve('./logs/pay_error.log'),
      out_file: resolve('./logs/pay_out.log'),
      pid_file: resolve('./logs/pay.pid'),
      exec_mode: 'cluster',
    },
  ]
}
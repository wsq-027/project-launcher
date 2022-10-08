export const DEFAULT_PROJECT = [
  {
    name: 'hospital(medical)',
    script: './bin/www',
    urlPrefix: '/medical',
    proxyHost: 'http://127.0.0.1:3331',
    dir: '~/Documents/work/zoe-health-hospital',
    isLocal: true,
  },
  {
    name: 'app-pay(pay)',
    script: './bin/www',
    urlPrefix: '/pay',
    proxyHost: 'http://127.0.0.1:3334',
    dir: '~/Documents/work/zoe-health-app-pay',
    isLocal: true,
  },
  {
    name: 'app',
    script: './bin/www',
    urlPrefix: '/',
    proxyHost: 'http://127.0.0.1:3330',
    dir: '~/Documents/work/zoe-health-app',
    isLocal: true,
  },
]

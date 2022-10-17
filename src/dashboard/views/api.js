import { isDesktop } from "./utils.js"

const { ElMessage: message } = ElementPlus

async function _api(url, { data, method, params = {} } = {}) {
  const _url = new URL(url, location.href)

  for (let key in params) {
    _url.searchParams.append(key, params[key])
  }

  const res = await fetch(_url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const _data = await res.json()

  if (!_data.success) {
    throw _data
  }

  return _data.data
}

function _sseApi(url, { params = {}, callback } = {}) {
  const _url = new URL(url, location.href)

  for (let key in params) {
    _url.searchParams.append(key, params[key])
  }

  const sse = new EventSource(_url)

  sse.addEventListener('message', (event) => {
    callback(JSON.parse(event.data))
  })

  return function close() {
    sse.close()
  }
}

export async function api(url, { data, method = 'GET', params = {}} = {}) {
  try {
    if (isDesktop) {
      return window.projectApi.invoke({method, url, data: { ...data, ...params }})
    }

    return _api(url, { data, method, params })
  } catch (e) {
    message.error(e.message)
    throw e
  }
}

export function apiStream(url, { params = {}, callback } = {}) {
  try {
    if (isDesktop) {
      return window.projectApi.listen({ url, data: params, callback})
    }

    return _sseApi(url, { params, callback })
  } catch (e) {
    message.error(e.message)
    throw e
  }
}

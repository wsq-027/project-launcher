const { ElMessage: message } = ElementPlus

export async function api(url, { data, method, params = {} } = {}) {
  const _url = new URL(url, location.href)

  for (let key in params) {
    _url.searchParams.append(key, params[key])
  }

  try {
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
  } catch (e) {
    message.error(e.message)
    throw e
  }
}

export function sseApi(url, { params = {}, callback } = {}) {
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

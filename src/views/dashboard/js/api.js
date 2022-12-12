const { ElMessage: message } = ElementPlus

export async function api(url, { data, method = 'GET', params = {}} = {}) {
  try {
    return await window.projectApi.invoke({method, url, data: { ...data, ...params }})
  } catch (e) {
    message.error(e.message)
    throw e
  }
}

export function apiStream(url, { params = {}, callback } = {}) {
  const onError = (err) => {
    message.error(err.message)
  }

  try {
    return window.projectApi.listen({ url, data: params, callback, error: onError})
  } catch (e) {
    message.error(e.message)
    throw e
  }
}

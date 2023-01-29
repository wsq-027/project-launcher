import { ElMessage as message } from 'element-plus'

export async function api(channel, data = {}) {
  try {
    return await window.projectApi.invoke(channel, data)
  } catch (e) {
    message.error(e.message)
    throw e
  }
}

export function apiStream(channel, params = {}, callback) {
  const onError = (err) => {
    message.error(err.message)
  }

  try {
    return window.projectApi.duplex(channel, params, {callback, error: onError})
  } catch (e) {
    message.error(e.message)
    throw e
  }
}

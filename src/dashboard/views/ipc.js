export function api(url, { method = 'GET', data, params = {} } = {}) {
  return projectApi.invoke({method, url, data: { ...data, ...params }})
}

export function sseApi(url, { params = {}, callback } = {}) {
  return projectApi.listen({ url, data: params, callback})
}


import { handler as netlifyHandler } from '../netlify/functions/api.js'

function originalApiUrl(request: Request) {
  const functionUrl = new URL(request.url)
  const path = functionUrl.searchParams.get('path')?.replace(/^\/+/, '') ?? ''
  const apiUrl = new URL(`/api/${path}`, functionUrl.origin)

  functionUrl.searchParams.forEach((value, name) => {
    if (name !== 'path') apiUrl.searchParams.append(name, value)
  })

  return apiUrl
}

export default {
  async fetch(request: Request) {
    const url = originalApiUrl(request)
    const headers: Record<string, string> = {}
    request.headers.forEach((value, name) => {
      headers[name] = value
    })

    const result = await netlifyHandler({
      httpMethod: request.method,
      path: url.pathname,
      rawUrl: url.toString(),
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : await request.text(),
    })

    return new Response(result.body, {
      status: result.statusCode,
      headers: result.headers,
    })
  },
}

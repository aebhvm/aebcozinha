import { handler as netlifyHandler } from '../netlify/functions/api.js'

async function handler(request: Request) {
  const url = new URL(request.url)
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
}

export default { fetch: handler }

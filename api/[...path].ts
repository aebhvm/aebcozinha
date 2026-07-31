import { handler as netlifyHandler } from '../netlify/functions/api'

export default async function handler(request: Request) {
  const url = new URL(request.url)
  const body = request.method === 'GET' || request.method === 'HEAD' ? null : await request.text()
  const result = await netlifyHandler({
    httpMethod: request.method,
    path: url.pathname,
    rawUrl: url.toString(),
    headers: Object.fromEntries(request.headers.entries()),
    body,
  })

  return new Response(result.body, {
    status: result.statusCode,
    headers: result.headers,
  })
}

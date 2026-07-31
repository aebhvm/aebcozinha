import type { IncomingMessage, ServerResponse } from 'node:http'
import { handler as netlifyHandler } from '../netlify/functions/api'

type VercelRequest = IncomingMessage & { body?: unknown }

async function bodyOf(request: VercelRequest) {
  if (typeof request.body === 'string') return request.body
  if (request.body !== undefined) return JSON.stringify(request.body)

  return await new Promise<string>((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

export default async function handler(request: VercelRequest, response: ServerResponse) {
  const protocol = request.headers['x-forwarded-proto'] ?? 'https'
  const host = request.headers.host ?? 'localhost'
  const url = new URL(request.url ?? '/api', `${protocol}://${host}`)
  const headers = Object.fromEntries(
    Object.entries(request.headers).map(([name, value]) => [name, Array.isArray(value) ? value.join(', ') : value]),
  )
  const result = await netlifyHandler({
    httpMethod: request.method ?? 'GET',
    path: url.pathname,
    rawUrl: url.toString(),
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? null : await bodyOf(request),
  })

  response.statusCode = result.statusCode
  for (const [name, value] of Object.entries(result.headers)) {
    response.setHeader(name, value)
  }
  response.end(result.body)
}

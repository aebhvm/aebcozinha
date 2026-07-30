import { createReadStream, existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer, type IncomingMessage } from 'node:http'
import { extname, join } from 'node:path'
import { handler } from '../netlify/functions/api'

const port = Number(process.env.PORT ?? 8888)
const root = join(process.cwd(), 'dist')

const types: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}

function readBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`)

    if (url.pathname.startsWith('/api/')) {
      const result = await handler({
        httpMethod: request.method ?? 'GET',
        path: url.pathname,
        rawUrl: url.toString(),
        headers: Object.fromEntries(
          Object.entries(request.headers).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : value,
          ]),
        ),
        body: request.method === 'GET' ? null : await readBody(request),
      })

      response.writeHead(result.statusCode, result.headers)
      response.end(result.body)
      return
    }

    const requested = url.pathname === '/' ? '/index.html' : url.pathname
    const filePath = join(root, requested)
    const fallback = join(root, 'index.html')
    const target = existsSync(filePath) ? filePath : fallback

    response.writeHead(200, {
      'Content-Type': types[extname(target)] ?? 'application/octet-stream',
    })
    createReadStream(target).pipe(response)
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro inesperado.' }))
  }
}).listen(port, () => {
  console.log(`Servidor local pronto em http://localhost:${port}`)
})

if (!existsSync(join(root, 'index.html'))) {
  console.warn('Aviso: rode npm run build antes de abrir o servidor local.')
  await readFile(join(root, 'index.html')).catch(() => undefined)
}

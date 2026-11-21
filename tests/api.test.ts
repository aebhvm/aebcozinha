// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('@neondatabase/serverless', () => ({ neon: () => ({ query }) }))

const testSecret = 'test-only-secret-not-used-in-any-environment-12345'

afterEach(() => vi.unstubAllEnvs())

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('DATABASE_URL', 'postgresql://test-only.invalid/audit')
  vi.stubEnv('JWT_SECRET', testSecret)
  query.mockReset()
  query.mockImplementation(async (sql: string, args?: unknown[]) => {
    if (sql.includes('from app_meta')) return [{ value: args?.[0] === 'security_schema_version' ? '2026-11-21-login-security-v1' : '2026-09-17-stock-orders-idempotency-v1' }]
    if (sql.includes('insert into auth_login_limits')) return [{ attempts: 1, retry_after: 900 }]
    if (sql.includes('from users where id')) return [{ id: 7, name: 'Teste', username: 'teste', role: 'colaborador', active: 1 }]
    return []
  })
})

async function request(path: string, method = 'GET', body: string | null = null, token?: string) {
  const { handler } = await import('../netlify/functions/api')
  return handler({ path: `/api${path}`, rawUrl: `https://test.invalid/api${path}`, httpMethod: method, body, headers: token ? { authorization: `Bearer ${token}` } : {} })
}

async function token(expiration = '1h') {
  return new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('7').setExpirationTime(expiration).sign(new TextEncoder().encode(testSecret))
}

describe('API security boundaries with mocked database', () => {
  it('answers preflight without accessing the database', async () => {
    expect((await request('/users', 'OPTIONS')).statusCode).toBe(204)
    expect(query).not.toHaveBeenCalled()
  })
  it('rejects requests without a session', async () => {
    expect((await request('/users')).statusCode).toBe(401)
  })
  it('rejects forged tokens', async () => {
    expect((await request('/users', 'GET', null, 'invalid')).statusCode).toBe(401)
  })
  it('rejects expired sessions', async () => {
    expect((await request('/users', 'GET', null, await token('0s'))).statusCode).toBe(401)
  })
  it('rejects inactive users even with a signed token', async () => {
    query.mockImplementation(async (sql: string, args?: unknown[]) => sql.includes('from app_meta') ? [{ value: args?.[0] === 'security_schema_version' ? '2026-11-21-login-security-v1' : '2026-09-17-stock-orders-idempotency-v1' }] : [])
    expect((await request('/users', 'GET', null, await token())).statusCode).toBe(401)
  })
  it('denies collaborator access to the user administration', async () => {
    expect((await request('/users', 'GET', null, await token())).statusCode).toBe(403)
  })
  it.each([
    ['/manager-reports', 'GET'],
    ['/products/1', 'PUT'],
    ['/stock-orders/1/status', 'PUT'],
  ])('denies collaborator access to %s via %s', async (path, method) => {
    expect((await request(path, method, '{}', await token())).statusCode).toBe(403)
  })
  it('allows the manager to list users', async () => {
    query.mockImplementation(async (sql: string, args?: unknown[]) => {
      if (sql.includes('from app_meta')) return [{ value: args?.[0] === 'security_schema_version' ? '2026-11-21-login-security-v1' : '2026-09-17-stock-orders-idempotency-v1' }]
      if (sql.includes('from users where id')) return [{ id: 7, name: 'Teste', username: 'teste', role: 'gestor', active: 1 }]
      return []
    })
    expect((await request('/users', 'GET', null, await token())).statusCode).toBe(200)
  })
  it('does not echo invalid input values in validation errors', async () => {
    const response = await request('/auth/login', 'POST', JSON.stringify({ username: { private: 'test-input' }, pin: '1234' }))
    expect(response.statusCode).toBe(400)
    expect(response.body).not.toContain('test-input')
  })
  it('returns a safe client error for malformed JSON', async () => {
    const response = await request('/auth/login', 'POST', '{broken')
    expect(response.statusCode).toBe(400)
    expect(response.body).not.toContain('broken')
  })
  it('hides internal database error details', async () => {
    query.mockRejectedValue(new Error('internal database host and query details'))
    const response = await request('/auth/login', 'POST', '{}')
    expect(response.statusCode).toBe(500)
    expect(response.body).not.toContain('database')
    expect(response.body).not.toContain('query')
  })
  it('parameterizes login input instead of interpolating SQL', async () => {
    const username = "' OR 1=1 --"
    expect((await request('/auth/login', 'POST', JSON.stringify({ username, pin: '1234' }))).statusCode).toBe(401)
    const loginQuery = query.mock.calls.find(([sql]) => String(sql).includes('pin_hash'))
    expect(loginQuery?.[0]).not.toContain(username)
    expect(loginQuery?.[1]).toEqual([username])
  })
})

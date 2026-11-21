// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import type { DbRow } from '../netlify/functions/lib/database'

const state = vi.hoisted(() => ({ pg: null as PGlite | null }))

class DeferredQuery implements PromiseLike<DbRow[]> {
  readonly text: string
  readonly args: unknown[]
  constructor(text: string, args: unknown[] = []) { this.text = text; this.args = args }
  then<T = DbRow[], E = never>(resolve?: ((rows: DbRow[]) => T | PromiseLike<T>) | null, reject?: ((error: unknown) => E | PromiseLike<E>) | null) {
    if (!state.pg) throw new Error('Disposable database not initialized')
    return state.pg.query<DbRow>(this.text, this.args).then((result) => result.rows).then(resolve, reject)
  }
}

// Only the HTTP transport is replaced. The real handler, SQL, migrations,
// bcrypt, JWT, permissions and PostgreSQL transactions execute unchanged.
vi.mock('@neondatabase/serverless', () => ({ neon: () => ({
  query: (text: string, args?: unknown[]) => new DeferredQuery(text, args),
  transaction: async (queries: DeferredQuery[]) => {
    if (!state.pg) throw new Error('Disposable database not initialized')
    return state.pg.transaction(async (tx) => {
      const results: DbRow[][] = []
      for (const query of queries) results.push((await tx.query<DbRow>(query.text, query.args)).rows)
      return results
    })
  },
}) }))

let adminToken = ''
let workerToken = ''
let otherToken = ''
let keeperToken = ''
let workerId = 0
let productId = 0
let secondProductId = 0

async function request(path: string, method = 'GET', body?: unknown, token?: string, extraHeaders: Record<string, string> = {}) {
  const { handler } = await import('../netlify/functions/api')
  return handler({ path: `/api${path}`, rawUrl: `https://test.invalid/api${path}`, httpMethod: method, body: body === undefined ? null : JSON.stringify(body), headers: { ...extraHeaders, ...(token ? { authorization: `Bearer ${token}` } : {}) } })
}

async function login(username: string, pin = '928471') {
  const result = await request('/auth/login', 'POST', { username, pin })
  expect(result.statusCode).toBe(200)
  return JSON.parse(result.body) as { token: string; user: { id: number } }
}

async function count(table: string) {
  // Table names below are fixed test constants, never user input.
  return Number((await state.pg!.query<{ count: number }>(`select count(*) from ${table}`)).rows[0].count)
}

beforeAll(async () => {
  vi.stubEnv('DATABASE_URL', 'postgresql://disposable.invalid/test-only')
  vi.stubEnv('JWT_SECRET', 'integration-test-only-secret-not-used-in-production-12345')
  vi.stubEnv('INITIAL_ADMIN_PIN', '928471')
  vi.stubEnv('INITIAL_STOCKKEEPER_PIN', '')
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('NETLIFY', '')
  state.pg = new PGlite() // In memory; no files, Neon connections or real records.
  await state.pg.waitReady
  adminToken = (await login('admin')).token
  for (const [username, role] of [['audit-worker', 'colaborador'], ['audit-other', 'colaborador'], ['audit-keeper', 'estoquista']]) {
    expect((await request('/users', 'POST', { name: username, username, role, pin: '928471' }, adminToken)).statusCode).toBe(201)
  }
  const worker = await login('audit-worker')
  workerToken = worker.token
  workerId = worker.user.id
  otherToken = (await login('audit-other')).token
  keeperToken = (await login('audit-keeper')).token
  const first = await request('/products', 'POST', { name: 'Arroz de teste', category: 'Alimentos', unit: 'kg' }, adminToken)
  const second = await request('/products', 'POST', { name: 'Feijão de teste', category: 'Alimentos', unit: 'kg' }, adminToken)
  expect(first.statusCode).toBe(201)
  expect(second.statusCode).toBe(201)
  productId = JSON.parse(first.body).id
  secondProductId = JSON.parse(second.body).id
}, 60_000)

afterAll(async () => { await state.pg?.close(); vi.unstubAllEnvs() })

describe.sequential('API with disposable PostgreSQL', () => {
  it('rolls back the parent and every order item after a child failure, allowing an identical retry', async () => {
    await state.pg!.exec(`create function audit_fail_item() returns trigger language plpgsql as $$
      begin if new.quantity = 'AUDIT_FAIL' and current_setting('audit.fail_items', true) = 'on' then raise exception 'induced item failure'; end if; return new; end $$;
      create trigger audit_fail_item before insert on stock_order_items for each row execute function audit_fail_item();`)
    const beforeOrders = await count('stock_orders'), beforeItems = await count('stock_order_items')
    const body = { date: '2026-11-21', items: [{ product_id: productId, quantity: '2' }, { product_id: secondProductId, quantity: 'AUDIT_FAIL' }] }
    await state.pg!.query("select set_config('audit.fail_items', 'on', false)")
    expect((await request('/stock-orders', 'POST', body, workerToken)).statusCode).toBe(500)
    expect(await count('stock_orders')).toBe(beforeOrders)
    expect(await count('stock_order_items')).toBe(beforeItems)
    await state.pg!.query("select set_config('audit.fail_items', 'off', false)")
    expect((await request('/stock-orders', 'POST', body, workerToken)).statusCode).toBe(201)
    expect(await count('stock_orders')).toBe(beforeOrders + 1)
    expect(await count('stock_order_items')).toBe(beforeItems + 2)
  })

  it('creates only one order when identical requests arrive together', async () => {
    const body = { date: '2026-11-21', notes: 'Concurrent test', items: [{ product_id: productId, quantity: '4' }] }
    const before = await count('stock_orders')
    const responses = await Promise.all([request('/stock-orders', 'POST', body, workerToken), request('/stock-orders', 'POST', body, workerToken)])
    expect(responses.map((r) => r.statusCode).sort()).toEqual([201, 409])
    expect(await count('stock_orders')).toBe(before + 1)
  })

  it('rolls back a report and all attachments if one attachment fails', async () => {
    await state.pg!.exec(`create function audit_fail_attachment() returns trigger language plpgsql as $$
      begin if new.file_name = 'audit-fail.png' and current_setting('audit.fail_attachments', true) = 'on' then raise exception 'induced attachment failure'; end if; return new; end $$;
      create trigger audit_fail_attachment before insert on manager_report_attachments for each row execute function audit_fail_attachment();`)
    const attachment = { attachment_type: 'imagem', mime_type: 'image/png', size_bytes: 1, data_url: 'data:image/png;base64,AA==' }
    const body = { title: 'Teste de atomicidade', body: 'Relatório de teste', attachments: [{ ...attachment, file_name: 'audit-pass.png' }, { ...attachment, file_name: 'audit-fail.png' }] }
    const beforeReports = await count('manager_reports'), beforeAttachments = await count('manager_report_attachments')
    await state.pg!.query("select set_config('audit.fail_attachments', 'on', false)")
    expect((await request('/manager-reports', 'POST', body, adminToken)).statusCode).toBe(500)
    expect(await count('manager_reports')).toBe(beforeReports)
    expect(await count('manager_report_attachments')).toBe(beforeAttachments)
    await state.pg!.query("select set_config('audit.fail_attachments', 'off', false)")
    expect((await request('/manager-reports', 'POST', body, adminToken)).statusCode).toBe(201)
    expect(await count('manager_report_attachments')).toBe(beforeAttachments + 2)
  })

  it('rolls back every statement in a failing database batch', async () => {
    const { getDb } = await import('../netlify/functions/lib/database')
    await expect(getDb().batch([{ sql: 'insert into app_meta(key,value) values (?,?)', args: ['audit-rollback', 'test'] }, 'select 1 / 0'])).rejects.toThrow()
    expect((await state.pg!.query("select value from app_meta where key='audit-rollback'")).rows).toEqual([])
  })

  it('lists attachment metadata and only sends content to an authorized manager on demand', async () => {
    const reports = await request('/manager-reports', 'GET', undefined, adminToken)
    expect(reports.statusCode).toBe(200)
    expect(reports.body).not.toContain('data:image/png')
    const attachment = JSON.parse(reports.body)[0].attachments[0]
    expect(attachment.data_url).toBeUndefined()
    expect((await request(`/manager-reports/attachments/${attachment.id}`, 'GET', undefined, workerToken)).statusCode).toBe(403)
    const media = await request(`/manager-reports/attachments/${attachment.id}`, 'GET', undefined, adminToken)
    expect(media.statusCode).toBe(200)
    expect('isBase64Encoded' in media && media.isBase64Encoded).toBe(true)
    expect(media.headers['Content-Type']).toBe('image/png')
    expect(media.body).toBe('AA==')
    const { default: relay } = await import('../api/relay')
    const response = await relay.fetch(new Request(`https://test.invalid/api/relay?path=manager-reports/attachments/${attachment.id}`, { headers: { Authorization: `Bearer ${adminToken}` } }))
    expect(response.status).toBe(200)
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([0])
  })

  it('only lets the owner or a manager change a movement', async () => {
    const body = { product_id: productId, movement_type: 'saida', quantity: 2, date: '2026-11-21' }
    const created = await request('/stock-movements', 'POST', body, workerToken)
    expect(created.statusCode).toBe(201)
    const movement = JSON.parse(created.body)
    expect(Number(movement.created_by)).toBe(workerId)
    for (const token of [otherToken, keeperToken]) {
      expect((await request(`/stock-movements/${movement.id}`, 'PUT', { ...body, quantity: 99 }, token)).statusCode).toBe(403)
      expect((await request(`/stock-movements/${movement.id}`, 'DELETE', undefined, token)).statusCode).toBe(403)
    }
    expect((await request(`/stock-movements/${movement.id}`, 'PUT', { ...body, quantity: 3 }, workerToken)).statusCode).toBe(200)
    expect((await request(`/stock-movements/${movement.id}`, 'PUT', { ...body, quantity: 4 }, adminToken)).statusCode).toBe(200)
    expect((await request(`/stock-movements/${movement.id}`, 'DELETE', undefined, adminToken)).statusCode).toBe(200)
  })

  it('limits concurrent login attempts persistently and supplies Retry-After', async () => {
    const responses = await Promise.all(Array.from({ length: 12 }, (_, i) => request('/auth/login', 'POST', { username: 'audit-limited-account', pin: 'wrong' }, undefined, { 'x-forwarded-for': `192.0.2.${i}` })))
    expect(responses.filter((r) => r.statusCode === 401)).toHaveLength(10)
    expect(responses.filter((r) => r.statusCode === 429)).toHaveLength(2)
    const blocked = responses.find((r) => r.statusCode === 429)!
    expect(Number((blocked.headers as Record<string, string>)['Retry-After'])).toBeGreaterThan(0)
    const bucket = (await state.pg!.query<{ key_hash: string; attempts: number }>('select key_hash, attempts from auth_login_limits where attempts = 12')).rows[0]
    expect(bucket.key_hash).toMatch(/^[a-f0-9]{64}$/)
    vi.resetModules()
    expect((await request('/auth/login', 'POST', { username: 'audit-limited-account', pin: 'wrong' })).statusCode).toBe(429)
    await state.pg!.query("update auth_login_limits set expires_at = now() - interval '1 second' where key_hash = $1", [bucket.key_hash])
    expect((await request('/auth/login', 'POST', { username: 'audit-limited-account', pin: 'wrong' })).statusCode).toBe(401)
  })

  it('resets account attempts after a valid login', async () => {
    for (let i = 0; i < 3; i++) expect((await request('/auth/login', 'POST', { username: 'audit-worker', pin: 'wrong' })).statusCode).toBe(401)
    await login('audit-worker')
    for (let i = 0; i < 10; i++) expect((await request('/auth/login', 'POST', { username: 'audit-worker', pin: 'wrong' })).statusCode).toBe(401)
    expect((await request('/auth/login', 'POST', { username: 'audit-worker', pin: 'wrong' })).statusCode).toBe(429)
  })

  it('revokes existing sessions when a manager changes the PIN', async () => {
    const response = await request(`/users/${workerId}`, 'PUT', { name: 'audit-worker', username: 'audit-worker', role: 'colaborador', active: true, pin: '836492' }, adminToken)
    expect(response.statusCode).toBe(200)
    expect((await request('/products', 'GET', undefined, workerToken)).statusCode).toBe(401)
    // Expire the deliberately exhausted account bucket from the previous test.
    await state.pg!.query("update auth_login_limits set expires_at = now() - interval '1 second'")
    workerToken = (await login('audit-worker', '836492')).token
    expect((await request('/products', 'GET', undefined, workerToken)).statusCode).toBe(200)
  })

  it('limits trusted IPs across different accounts without trusting a forged forwarding header', async () => {
    vi.stubEnv('VERCEL', '1')
    const { checkLoginAttempts } = await import('../netlify/functions/lib/security')
    const results = await Promise.allSettled(Array.from({ length: 101 }, (_, i) => checkLoginAttempts(`audit-ip-${i}`, { 'x-vercel-forwarded-for': '192.0.2.10', 'x-forwarded-for': `192.0.2.${i}` })))
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(100)
    const failure = results.find((r) => r.status === 'rejected') as PromiseRejectedResult
    expect(failure.reason.statusCode).toBe(429)
    vi.stubEnv('VERCEL', '')
  })

  it('reapplies the additive migration without changing existing users, orders, reports or session versions', async () => {
    const tables = ['users', 'stock_orders', 'stock_order_items', 'manager_reports', 'manager_report_attachments']
    const before = await Promise.all(tables.map(count))
    const version = (await state.pg!.query('select session_version from users where id = $1', [workerId])).rows
    await state.pg!.exec(readFileSync(new URL('../database/migrations/2026-11-21-login-security.sql', import.meta.url), 'utf8'))
    expect(await Promise.all(tables.map(count))).toEqual(before)
    expect((await state.pg!.query('select session_version from users where id = $1', [workerId])).rows).toEqual(version)
  })
})

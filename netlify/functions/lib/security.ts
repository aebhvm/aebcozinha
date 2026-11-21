import { createHmac } from 'node:crypto'
import { getDb } from './database.js'

export const SECURITY_SCHEMA_VERSION = '2026-11-21-login-security-v1'
export const SECURITY_SCHEMA_STATEMENTS = [
  'alter table users add column if not exists session_version integer not null default 0',
  `create table if not exists auth_login_limits (
    key_hash text primary key,
    attempts integer not null,
    expires_at timestamptz not null
  )`,
  'create index if not exists idx_auth_login_limits_expiry on auth_login_limits(expires_at)',
  { sql: `insert into app_meta (key, value, updated_at) values ('security_schema_version', ?, current_timestamp)
    on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at`, args: [SECURITY_SCHEMA_VERSION] },
]

let ready: Promise<void> | null = null
let nextCleanup = 0

export async function ensureSecuritySchema() {
  if (!ready) {
    ready = (async () => {
      const result = await getDb().execute({ sql: 'select value from app_meta where key = ?', args: ['security_schema_version'] })
      if (result.rows[0]?.value !== SECURITY_SCHEMA_VERSION) await getDb().batch(SECURITY_SCHEMA_STATEMENTS)
    })().catch((error: unknown) => { ready = null; throw error })
  }
  await ready
}

function keyHash(value: string) {
  const secret = process.env.JWT_SECRET?.trim() ?? ''
  if (secret.length < 32) throw new Error('JWT_SECRET ausente ou fraco.')
  return createHmac('sha256', secret).update(value).digest('hex')
}

function accountKey(username: string) {
  return keyHash(`account:${username.trim().normalize('NFKC').toLocaleLowerCase('pt-BR')}`)
}

function trustedClientIp(headers: Record<string, string | undefined>) {
  if (process.env.VERCEL === '1') return headers['x-vercel-forwarded-for']?.split(',')[0]?.trim()
  if (process.env.NETLIFY === 'true') return headers['x-nf-client-connection-ip']?.trim()
  return undefined
}

async function consume(key: string, limit: number) {
  const result = await getDb().execute({
    sql: `insert into auth_login_limits (key_hash, attempts, expires_at) values (?, 1, now() + interval '15 minutes')
      on conflict(key_hash) do update set
        attempts = case when auth_login_limits.expires_at <= now() then 1 else auth_login_limits.attempts + 1 end,
        expires_at = case when auth_login_limits.expires_at <= now() then now() + interval '15 minutes' else auth_login_limits.expires_at end
      returning attempts, greatest(1, ceil(extract(epoch from (expires_at - now())))) as retry_after`,
    args: [key],
  })
  const row = result.rows[0]
  if (!row) throw new Error('Não foi possível verificar tentativas de acesso.')
  if (Number(row.attempts) > limit) {
    throw Object.assign(new Error('Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.'), { statusCode: 429, retryAfter: Number(row.retry_after) })
  }
}

export async function checkLoginAttempts(username: string, headers: Record<string, string | undefined>) {
  if (Date.now() >= nextCleanup) {
    await getDb().execute(`delete from auth_login_limits where key_hash in
      (select key_hash from auth_login_limits where expires_at <= now() order by expires_at limit 1000)`)
    nextCleanup = Date.now() + 5 * 60_000
  }
  const ip = trustedClientIp(headers)
  if (ip) await consume(keyHash(`ip:${ip}`), 100)
  await consume(accountKey(username), 10)
}

export async function clearLoginAttempts(username: string) {
  await getDb().execute({ sql: 'delete from auth_login_limits where key_hash = ?', args: [accountKey(username)] })
}

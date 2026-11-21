import { neon } from '@neondatabase/serverless'

export type DbStatement = string | { sql: string; args?: unknown[] }
export type DbRow = Record<string, unknown>
export type Db = {
  execute: (statement: DbStatement) => Promise<{ rows: DbRow[] }>
  batch: (statements: DbStatement[], mode?: string) => Promise<void>
}

let db: Db | null = null

export function getDb(): Db {
  if (!db) {
    const connectionString = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL do Neon não configurada.')
    const sql = neon(connectionString)
    const prepare = (statement: DbStatement) => {
      const query = typeof statement === 'string' ? statement : statement.sql
      let index = 0
      return { text: query.replace(/\?/g, () => `$${++index}`), args: typeof statement === 'string' ? [] : statement.args ?? [] }
    }
    db = {
      execute: async (statement) => {
        const { text, args } = prepare(statement)
        return { rows: await sql.query(text, args) as DbRow[] }
      },
      batch: async (statements) => {
        if (statements.length === 0) return
        await sql.transaction(statements.map((statement) => {
          const { text, args } = prepare(statement)
          return sql.query(text, args)
        }))
      },
    }
  }
  return db
}

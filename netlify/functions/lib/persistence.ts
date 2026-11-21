import type { DbStatement } from './database.js'

type OrderItem = { product_id: number; product_name: string; product_category: string; product_unit: string; quantity: string }
type ReportAttachment = { attachment_type: string; file_name: string; mime_type: string; size_bytes: number; data_url: string }

// Each parent and its children are written by one PostgreSQL statement.
// A constraint or attachment failure rolls back the entire statement.
export function createOrderStatement(userId: number, date: string, fingerprint: string, notes: string | null, createdAt: string, items: OrderItem[]): DbStatement {
  return {
    sql: `with new_order as (
      insert into stock_orders (requested_by, requested_date, request_fingerprint, notes, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?) returning id
    ), inserted_items as (
      insert into stock_order_items (order_id, product_id, product_name, product_category, product_unit, quantity)
      select o.id, i.product_id, i.product_name, i.product_category, i.product_unit, i.quantity
      from new_order o cross join jsonb_to_recordset(?::jsonb)
      as i(product_id integer, product_name text, product_category text, product_unit text, quantity text)
    ) select id from new_order`,
    args: [userId, date, fingerprint, notes, createdAt, createdAt, JSON.stringify(items)],
  }
}

export function createReportStatement(userId: number, title: string, body: string, createdAt: string, attachments: ReportAttachment[]): DbStatement {
  return {
    sql: `with new_report as (
      insert into manager_reports (title, body, created_by, created_at) values (?, ?, ?, ?) returning id
    ), inserted_attachments as (
      insert into manager_report_attachments (report_id, attachment_type, file_name, mime_type, size_bytes, data_url, created_at)
      select r.id, a.attachment_type, a.file_name, a.mime_type, a.size_bytes, a.data_url, ?
      from new_report r cross join jsonb_to_recordset(?::jsonb)
      as a(attachment_type text, file_name text, mime_type text, size_bytes integer, data_url text)
    ) select id from new_report`,
    args: [title, body, userId, createdAt, createdAt, JSON.stringify(attachments)],
  }
}

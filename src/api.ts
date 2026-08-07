import type { BreakfastMenu, BreakfastMenuItem, DayPayload, InventoryCheckItem, InventoryCheckSector, InventoryCheckStatus, Notice, Priority, Product, ProductCategory, Schedule, Session, Station, StockCategory, StockMovement, StockMovementType, StockOrder, StockOrderStatus, Task, TechnicalSheet, User } from './types'

const SESSION_KEY = 'cozinha.session'

export function getSession(): Session | null {
  localStorage.removeItem(SESSION_KEY)
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as Session
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(session: Session) {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = getSession()
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const response = await fetch(path, { ...init, headers })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error ?? 'Não foi possível concluir a ação.')
  }

  return payload as T
}

export const api = {
  login: (username: string, pin: string) =>
    request<Session>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
    }),
  users: () => request<User[]>('/api/users'),
  createUser: (payload: { name: string; username: string; role: string; pin: string }) =>
    request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (id: number, payload: { name: string; username: string; role: string; active: boolean; pin?: string }) =>
    request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: number) =>
    request<{ ok: boolean }>(`/api/users/${id}`, {
      method: 'DELETE',
    }),
  stations: () => request<Station[]>('/api/stations'),
  createStation: (payload: { name: string; description?: string }) =>
    request<Station>('/api/stations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStation: (id: number, payload: { name: string; description?: string; active: boolean }) =>
    request<Station>(`/api/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteStation: (id: number) =>
    request<{ ok: boolean }>(`/api/stations/${id}`, {
      method: 'DELETE',
    }),
  day: (date: string) => request<DayPayload>(`/api/schedules?date=${date}`),
  createSchedule: (payload: {
    date: string
    user_id: number
    station_id: number
    break_start: string
  }) =>
    request<Schedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSchedule: (id: number) =>
    request<{ ok: boolean }>(`/api/schedules/${id}`, {
      method: 'DELETE',
    }),
  tasks: (date: string) => request<Task[]>(`/api/tasks?date=${date}`),
  pendingTasks: (date: string) => request<Task[]>(`/api/tasks/pending?date=${date}`),
  createTask: (payload: { date: string; user_id: number; title: string; notes?: string; priority: Priority; due_time?: string }) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTask: (id: number, payload: { date: string; user_id: number; title: string; notes?: string; priority: Priority; due_time?: string }) =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTask: (id: number) =>
    request<{ ok: boolean }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),
  completeTask: (id: number) =>
    request<Task>(`/api/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  notices: () => request<Notice[]>('/api/notices'),
  createNotice: (payload: { title: string; body?: string; pdf_name?: string; pdf_data_url?: string; expires_at?: string }) =>
    request<Notice>('/api/notices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateNotice: (id: number, payload: { title: string; body?: string; pdf_name?: string; pdf_data_url?: string; expires_at?: string }) =>
    request<Notice>(`/api/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteNotice: (id: number) =>
    request<{ ok: boolean }>(`/api/notices/${id}`, {
      method: 'DELETE',
    }),
  stockCategories: () => request<StockCategory[]>('/api/stock-categories'),
  createStockCategory: (payload: { name: string }) =>
    request<StockCategory>('/api/stock-categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStockCategory: (id: number, payload: { name: string; active: boolean }) =>
    request<StockCategory>(`/api/stock-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteStockCategory: (id: number) =>
    request<{ ok: boolean }>(`/api/stock-categories/${id}`, {
      method: 'DELETE',
    }),
  products: () => request<Product[]>('/api/products'),
  createProduct: (payload: { name: string; category: ProductCategory; unit: string; observations?: string }) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: number, payload: { name: string; category: ProductCategory; unit: string; observations?: string; active: boolean }) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: number) =>
    request<{ ok: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),
  inventoryCheckSectors: () => request<InventoryCheckSector[]>('/api/inventory-check-sectors'),
  createInventoryCheckSector: (payload: { name: string }) =>
    request<InventoryCheckSector>('/api/inventory-check-sectors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateInventoryCheckSector: (id: number, payload: { name: string; active: boolean }) =>
    request<InventoryCheckSector>(`/api/inventory-check-sectors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteInventoryCheckSector: (id: number) =>
    request<{ ok: boolean }>(`/api/inventory-check-sectors/${id}`, {
      method: 'DELETE',
    }),
  inventoryCheckItems: (date: string) => request<InventoryCheckItem[]>(`/api/inventory-check-items?date=${date}`),
  createInventoryCheckItem: (payload: { name: string; sector_id?: number | null }) =>
    request<InventoryCheckItem>('/api/inventory-check-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateInventoryCheckItem: (id: number, payload: { name: string; sector_id?: number | null; active: boolean }) =>
    request<InventoryCheckItem>(`/api/inventory-check-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteInventoryCheckItem: (id: number) =>
    request<{ ok: boolean }>(`/api/inventory-check-items/${id}`, {
      method: 'DELETE',
    }),
  updateInventoryCheckItemStatus: (id: number, status: InventoryCheckStatus, date: string) =>
    request<InventoryCheckItem>(`/api/inventory-check-items/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, date }),
    }),
  stockOrders: (date?: string) => request<StockOrder[]>(`/api/stock-orders${date ? `?date=${date}` : ''}`),
  createStockOrder: (payload: { date: string; notes?: string; items: Array<{ product_id: number; quantity: string }> }) =>
    request<StockOrder>('/api/stock-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStockOrderStatus: (id: number, status: StockOrderStatus) =>
    request<StockOrder>(`/api/stock-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  stockPendingCount: () => request<{ count: number }>('/api/stock-orders/pending-count'),
  stockMovements: (date?: string) => request<StockMovement[]>(`/api/stock-movements${date ? `?date=${date}` : ''}`),
  createStockMovement: (payload: { product_id: number; movement_type: StockMovementType; quantity: number; date: string; notes?: string }) =>
    request<StockMovement>('/api/stock-movements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStockMovement: (id: number, payload: { product_id: number; movement_type: StockMovementType; quantity: number; date: string; notes?: string }) =>
    request<StockMovement>(`/api/stock-movements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteStockMovement: (id: number) =>
    request<{ ok: boolean }>(`/api/stock-movements/${id}`, {
      method: 'DELETE',
    }),
  breakfastMenus: () => request<BreakfastMenu[]>('/api/breakfast-menus'),
  createBreakfastMenuItem: (payload: { menu_id: string; section: string; item: string; values: BreakfastMenuItem['values'] }) =>
    request<BreakfastMenuItem>('/api/breakfast-menu-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBreakfastMenuItem: (id: number, payload: { section: string; item: string; values: BreakfastMenuItem['values']; active: boolean }) =>
    request<BreakfastMenuItem>(`/api/breakfast-menu-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteBreakfastMenuItem: (id: number) =>
    request<{ ok: boolean }>(`/api/breakfast-menu-items/${id}`, {
      method: 'DELETE',
    }),
  technicalSheets: () => request<TechnicalSheet[]>('/api/technical-sheets'),
  createTechnicalSheet: (payload: { name: string; ingredients: string; preparation: string; photo_data_url: string | null }) =>
    request<TechnicalSheet>('/api/technical-sheets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTechnicalSheet: (id: number, payload: { name: string; ingredients: string; preparation: string; photo_data_url: string | null; active: boolean }) =>
    request<TechnicalSheet>(`/api/technical-sheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTechnicalSheet: (id: number) =>
    request<{ ok: boolean }>(`/api/technical-sheets/${id}`, {
      method: 'DELETE',
    }),
}













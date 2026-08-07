export type Role = 'gestor' | 'colaborador' | 'estoquista'

export type User = {
  id: number
  name: string
  username: string
  role: Role
  active: boolean
}

export type Station = {
  id: number
  name: string
  description: string | null
  active: boolean
}

export type Priority = 'baixa' | 'normal' | 'alta' | 'urgente'

export type ProductCategory = string

export type StockCategory = {
  id: number
  name: string
  active: boolean
  created_at: string
}

export type Product = {
  id: number
  name: string
  category: ProductCategory
  unit: string
  observations: string | null
  active: boolean
  created_at: string
}

export type InventoryCheckStatus = 'ok' | 'pedir' | 'produzir'

export type InventoryCheckSector = {
  id: number
  name: string
  active: boolean
  created_at: string
}

export type InventoryCheckItem = {
  id: number
  name: string
  sector_id: number | null
  sector_name: string | null
  status: InventoryCheckStatus | null
  checked_date: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type StockOrderStatus = 'pendente' | 'separado' | 'entregue'

export type StockMovementType = 'entrada' | 'saida'

export type StockMovement = {
  id: number
  product_id: number
  product_name: string
  movement_type: StockMovementType
  quantity: number
  unit: string
  movement_date: string
  notes: string | null
  created_at: string
  created_by_name: string
}

export type StockOrderItem = {
  id: number
  order_id: number
  product_id: number
  product_name: string
  product_category: ProductCategory
  product_unit: string
  quantity: string
}

export type StockOrder = {
  id: number
  requested_by: number
  requested_by_name: string
  requested_date: string
  notes: string | null
  status: StockOrderStatus
  created_at: string
  updated_at: string
  items: StockOrderItem[]
}

export type Schedule = {
  id: number
  date: string
  user_id: number
  station_id: number
  break_start: string
  break_end: string
  user_name: string
  station_name: string
  station_description: string | null
}

export type Task = {
  id: number
  date: string
  user_id: number
  title: string
  notes: string | null
  priority: Priority
  due_time: string | null
  user_name: string
  completed_at: string | null
  completed_by_name: string | null
}

export type Notice = {
  id: number
  title: string
  body: string | null
  pdf_name: string | null
  pdf_data_url: string | null
  expires_at: string | null
  created_at: string
}

export type Session = {
  token: string
  user: User
}

export type DayPayload = {
  date: string
  schedules: Schedule[]
  tasks: Task[]
}

export type BreakfastMenuDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'

export type BreakfastMenuItem = {
  id: number
  menu_id: string
  menu_title: string
  section: string
  item: string
  values: Record<BreakfastMenuDay, string>
  active: boolean
  sort_order: number
}

export type BreakfastMenu = {
  id: string
  title: string
  items: BreakfastMenuItem[]
}

export type TechnicalSheet = {
  id: number
  name: string
  photo_data_url: string | null
  ingredients: string
  preparation: string
  active: boolean
  created_at: string
  updated_at: string
  created_by_name: string | null
}




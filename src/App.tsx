import {
  BookOpen,
  Boxes,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CookingPot,
  Download,
  Edit3,
  FileText,
  Gauge,
  History,
  ImagePlus,
  LogOut,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { api, clearSession, getSession, saveSession } from './api'
import { currentMenuDay, menuDays, type MenuDay } from './menuData'
import './App.css'
import { formatDate, formatDateTime, todayIso } from './date'
import type { BreakfastMenu, BreakfastMenuItem, DayPayload, InventoryCheckItem, InventoryCheckSector, InventoryCheckStatus, Notice, Priority, Product, ProductCategory, Schedule, Session, Station, StockCategory, StockOrder, StockOrderStatus, Task, TechnicalSheet, User } from './types'

type LoadState<T> = {
  data: T | null
  loading: boolean
  error: string
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isStandalone) return

    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIos(isIosDevice)
    if (isIosDevice) setVisible(true)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function installApp() {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setInstallEvent(null)
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <aside className="install-app-prompt" role="dialog" aria-label="Instalar aplicativo">
      <div className="install-app-prompt-icon" aria-hidden="true"><Download size={20} /></div>
      <div className="install-app-prompt-copy">
        <strong>Instale a Escala da Cozinha</strong>
        {installEvent ? (
          <p>Baixe o app no celular para abrir mais rápido.</p>
        ) : ios ? (
          <p>No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>
        ) : null}
      </div>
      <div className="install-app-prompt-actions">
        {installEvent && <button type="button" className="primary compact" onClick={() => void installApp()}>Baixar app</button>}
        <button type="button" className="secondary icon-button" onClick={() => setVisible(false)} aria-label="Fechar aviso" title="Fechar aviso">×</button>
      </div>
    </aside>
  )
}

function homePath(session: Session) {
  if (session.user.role === 'gestor') return '/gestor/dashboard'
  if (session.user.role === 'estoquista') return '/estoque'
  return '/colaborador/hoje'
}

function App() {
  const [session, setSession] = useState<Session | null>(() => getSession())



  function onLogin(next: Session) {
    saveSession(next)
    setSession(next)
  }

  function logout() {
    clearSession()
    setSession(null)
  }

  return (
    <>
      <InstallAppPrompt />
      <Routes>
      <Route path="/login" element={<LoginPage onLogin={onLogin} session={session} />} />
      <Route
        path="/gestor/dashboard"
        element={
          <Protected session={session} role="gestor">
            <DashboardPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/gestor/dia/:date"
        element={
          <Protected session={session} role="gestor">
            <ManagerDay session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/gestor/colaboradores"
        element={
          <Protected session={session} role="gestor">
            <UsersPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/gestor/pracas"
        element={
          <Protected session={session} role="gestor">
            <StationsPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/gestor/historico"
        element={
          <Protected session={session} role="gestor">
            <HistoryPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/gestor/mural"
        element={
          <Protected session={session} role="gestor">
            <NoticesPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/gestor/cardapio"
        element={
          <Protected session={session} role="gestor">
            <MenuPage session={session!} onLogout={logout} canManage />
          </Protected>
        }
      />
      <Route
        path="/gestor/fichas"
        element={
          <Protected session={session} role="gestor">
            <TechnicalSheetsPage session={session!} onLogout={logout} canManage />
          </Protected>
        }
      />
      <Route
        path="/gestor/estoque"
        element={
          <Protected session={session} role="gestor">
            <StockPage session={session!} onLogout={logout} canManageCatalog />
          </Protected>
        }
      />
      <Route
        path="/gestor/conferencia"
        element={
          <Protected session={session} role="gestor">
            <InventoryCheckPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/estoque"
        element={
          <Protected session={session} role="estoquista">
            <StockPage session={session!} onLogout={logout} canManageCatalog />
          </Protected>
        }
      />
      <Route
        path="/colaborador/hoje"
        element={
          <Protected session={session} role="colaborador">
            <WorkerToday session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/colaborador/cardapio"
        element={
          <Protected session={session} role="colaborador">
            <MenuPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/colaborador/fichas"
        element={
          <Protected session={session} role="colaborador">
            <TechnicalSheetsPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="/colaborador/pedidos"
        element={
          <Protected session={session} role="colaborador">
            <WorkerOrdersPage session={session!} onLogout={logout} />
          </Protected>
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={session ? homePath(session) : '/login'}
            replace
          />
        }
      />
    </Routes>
    </>
  )
}

function Protected({
  children,
  session,
  role,
}: {
  children: ReactNode
  session: Session | null
  role: 'gestor' | 'colaborador' | 'estoquista'
}) {
  if (!session) return <Navigate to="/login" replace />
  if (session.user.role !== role) {
    return (
      <Navigate
        to={homePath(session)}
        replace
      />
    )
  }
  return children
}

function LoginPage({ onLogin, session }: { onLogin: (session: Session) => void; session: Session | null }) {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (session) {
    return (
      <Navigate
        to={homePath(session)}
        replace
      />
    )
  }


  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const next = await api.login(username.trim(), pin.trim())
      onLogin(next)
      navigate(homePath(next))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login inválido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">
          <img src="/icons/login-logo.png" alt="" />
        </div>
        <h1>Escala da Cozinha</h1>
        <p>Organize praça, intervalo e tarefas diárias da equipe.</p>

        <form onSubmit={submit} className="stack">
          <label>
            Usuário
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            PIN
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary" disabled={loading}>
            <ShieldCheck size={20} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

function playStockNotification() {
  try {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.08
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    window.setTimeout(() => {
      oscillator.stop()
      void context.close()
    }, 180)
  } catch {
    // Some browsers block audio until the user interacts with the page.
  }
}

function Shell({
  children,
  title,
  subtitle,
  session,
  onLogout,
}: {
  children: ReactNode
  title: string
  subtitle: string
  session: Session
  onLogout: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stockPendingCount, setStockPendingCount] = useState(0)
  const previousStockPendingCount = useRef<number | null>(null)
  const closeSidebar = () => setSidebarOpen(false)

  useEffect(() => {
    if (session.user.role !== 'gestor' && session.user.role !== 'estoquista') return
    let cancelled = false

    async function loadPendingCount() {
      try {
        const payload = await api.stockPendingCount()
        if (cancelled) return
        setStockPendingCount(payload.count)
        if (previousStockPendingCount.current !== null && payload.count > previousStockPendingCount.current) {
          playStockNotification()
        }
        previousStockPendingCount.current = payload.count
      } catch {
        // The badge can recover on the next poll.
      }
    }

    void loadPendingCount()
    const timer = window.setInterval(loadPendingCount, 30000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [session.user.role])

  function logout() {
    closeSidebar()
    onLogout()
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setSidebarOpen((current) => !current)}
      >
        <MoreVertical size={22} />
      </button>
      {sidebarOpen && <button type="button" className="sidebar-scrim" aria-label="Fechar menu" onClick={closeSidebar} />}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <Link className="brand" to={homePath(session)} onClick={closeSidebar}>
          <CookingPot size={24} />
          <span>{session.user.role === 'estoquista' ? 'Pedidos' : 'Escala Cozinha'}</span>
        </Link>
        <button className="ghost sidebar-action top" onClick={logout}>
          <LogOut size={19} /> Sair
        </button>
        {session.user.role === 'gestor' ? (
          <nav>
            <Link to="/gestor/dashboard" onClick={closeSidebar}>
              <Gauge size={19} /> Dashboard
            </Link>
            <Link to={`/gestor/dia/${todayIso()}`} onClick={closeSidebar}>
              <CalendarDays size={19} /> Escala
            </Link>
            <Link to="/gestor/colaboradores" onClick={closeSidebar}>
              <Users size={19} /> Colaboradores
            </Link>
            <Link to="/gestor/pracas" onClick={closeSidebar}>
              <MapPin size={19} /> Praças
            </Link>
            <Link to="/gestor/historico" onClick={closeSidebar}>
              <History size={19} /> Histórico
            </Link>
            <Link to="/gestor/mural" onClick={closeSidebar}>
              <FileText size={19} /> Mural
            </Link>
            <Link to="/gestor/cardapio" onClick={closeSidebar}>
              <ClipboardList size={19} /> Cardápio
            </Link>
            <Link to="/gestor/fichas" onClick={closeSidebar}>
              <BookOpen size={19} /> Fichas técnicas
            </Link>
            <Link to="/gestor/estoque" onClick={closeSidebar}>
              <Boxes size={19} /> Pedidos
              {stockPendingCount > 0 && <span className="nav-badge">{stockPendingCount}</span>}
            </Link>
            <Link to="/gestor/conferencia" onClick={closeSidebar}>
              <CheckCircle2 size={19} /> Conferência
            </Link>
          </nav>
        ) : session.user.role === 'estoquista' ? (
          <nav>
            <Link to="/estoque" onClick={closeSidebar}>
              <Boxes size={19} /> Pedidos
              {stockPendingCount > 0 && <span className="nav-badge">{stockPendingCount}</span>}
            </Link>
          </nav>
        ) : (
          <nav>
            <Link to="/colaborador/hoje" onClick={closeSidebar}>
              <ClipboardList size={19} /> Meu dia
            </Link>
            <Link to="/colaborador/cardapio" onClick={closeSidebar}>
              <FileText size={19} /> Cardápio
            </Link>
            <Link to="/colaborador/fichas" onClick={closeSidebar}>
              <BookOpen size={19} /> Fichas técnicas
            </Link>
            <Link to="/colaborador/pedidos" onClick={closeSidebar}>
              <ShoppingCart size={19} /> Meus pedidos
            </Link>
          </nav>
        )}
      </aside>
      <main className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">{session.user.role === 'estoquista' ? 'Estoquista' : session.user.role === 'gestor' ? 'Gestor' : 'Colaborador'}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="user-chip">{session.user.name}</div>
        </header>
        {children}
      </main>
    </div>
  )
}

const priorityLabels: Record<Priority, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

const productCategoryLabels: Record<string, string> = {
  alimentos: 'Alimentos',
  limpeza: 'Limpeza',
}

function stockCategoryLabel(category: string) {
  return productCategoryLabels[category.toLowerCase()] ?? category
}

const stockStatusLabels: Record<StockOrderStatus, string> = {
  pendente: 'Pendente',
  separado: 'Separado',
  entregue: 'Entregue',
}

const maxPdfSize = 3 * 1024 * 1024

function readPdf(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler o PDF.'))
    reader.readAsDataURL(file)
  })
}

function isOverdue(task: Task) {
  if (task.completed_at) return false
  const now = new Date()
  const limit = new Date(`${task.date}T${task.due_time || '23:59'}:00`)
  return limit.getTime() < now.getTime()
}

function DetailLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="detail-line">
      <span className="detail-label">{label}</span>
      {children}
    </span>
  )
}

function DashboardPage({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [date, setDate] = useState(todayIso())
  const [day, setDay] = useState<DayPayload | null>(null)
  const [pendingUntilDate, setPendingUntilDate] = useState<Task[]>([])

  useEffect(() => {
    void Promise.all([api.day(date), api.pendingTasks(date)]).then(([dayPayload, pendingTasksPayload]) => {
      setDay(dayPayload)
      setPendingUntilDate(pendingTasksPayload)
    })
  }, [date])

  const tasks = day?.tasks ?? []
  const schedules = day?.schedules ?? []
  const completed = tasks.filter((task) => task.completed_at)
  const overdue = pendingUntilDate.filter(isOverdue)
  const pending = tasks.filter((task) => !task.completed_at && !isOverdue(task))

  return (
    <Shell session={session} onLogout={onLogout} title="Dashboard" subtitle={formatDate(date)}>
      <section className="toolbar">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <Link className="button secondary" to={`/gestor/dia/${date}`}>
          <Edit3 size={18} /> Editar escala
        </Link>
      </section>

      <section className="metrics">
        <article className="metric"><span>Tarefas</span><strong>{tasks.length}</strong></article>
        <article className="metric success"><span>Concluídas</span><strong>{completed.length}</strong></article>
        <article className="metric warning"><span>Atrasadas</span><strong>{overdue.length}</strong></article>
        <article className="metric"><span>Na escala</span><strong>{schedules.length}</strong></article>
      </section>

      <section className="panel">
        <h2>Escala do dia</h2>
        <div className="list">
          {schedules.map((schedule) => (
            <article className="row-card" key={schedule.id}>
              <div className="card-details">
                <strong>{schedule.user_name}</strong>
                <DetailLine label="Praça">{schedule.station_name}</DetailLine>
                {schedule.station_description && <DetailLine label="Descrição da praça">{schedule.station_description}</DetailLine>}
              </div>
              <time className="detail-line schedule-time">
                <span className="detail-label">Intervalo</span>
                <span><Clock3 size={16} /> {schedule.break_start} - {schedule.break_end}</span>
              </time>
            </article>
          ))}
          {schedules.length === 0 && <p className="empty">Nenhuma escala criada para esta data.</p>}
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <h2>Tarefas atrasadas</h2>
          <TaskList tasks={overdue} showOwner showDate />
        </div>
        <div className="panel">
          <h2>Tarefas pendentes</h2>
          <TaskList tasks={pending} showOwner />
        </div>
      </section>

      <section className="panel">
        <h2>Tarefas concluidas</h2>
        <TaskList tasks={completed} showOwner />
      </section>
    </Shell>
  )
}

function ManagerDay({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const params = useParams()
  const navigate = useNavigate()
  const date = params.date ?? todayIso()
  const scheduleFormRef = useRef<HTMLFormElement>(null)
  const taskFormRef = useRef<HTMLFormElement>(null)
  const [day, setDay] = useState<LoadState<DayPayload>>({ data: null, loading: true, error: '' })
  const [users, setUsers] = useState<User[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [scheduleForm, setScheduleForm] = useState({ user_id: '', station_id: '', break_start: '' })
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [taskForm, setTaskForm] = useState<{ user_id: string; title: string; notes: string; priority: Priority; due_time: string }>({
    user_id: '',
    title: '',
    notes: '',
    priority: 'normal',
    due_time: '',
  })

  const collaborators = useMemo(() => users.filter((user) => user.role === 'colaborador' && user.active), [users])

  async function load() {
    setDay((current) => ({ ...current, loading: true, error: '' }))
    try {
      const [dayPayload, usersPayload, stationsPayload] = await Promise.all([
        api.day(date),
        api.users(),
        api.stations(),
      ])
      setDay({ data: dayPayload, loading: false, error: '' })
      setUsers(usersPayload)
      setStations(stationsPayload.filter((station) => station.active))
      setTaskForm((current) => ({
        ...current,
        user_id: current.user_id || String(usersPayload.find((user) => user.role === 'colaborador')?.id ?? ''),
      }))
    } catch (err) {
      setDay({ data: null, loading: false, error: err instanceof Error ? err.message : 'Erro ao carregar o dia.' })
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  async function createSchedule(event: FormEvent) {
    event.preventDefault()
    await api.createSchedule({
      date,
      user_id: Number(scheduleForm.user_id),
      station_id: Number(scheduleForm.station_id),
      break_start: scheduleForm.break_start,
    })
    setScheduleForm({ user_id: '', station_id: '', break_start: '' })
    await load()
  }

  async function createTask(event: FormEvent) {
    event.preventDefault()
    const payload = {
      date,
      user_id: Number(taskForm.user_id),
      title: taskForm.title,
      notes: taskForm.notes,
      priority: taskForm.priority,
      due_time: taskForm.due_time,
    }
    if (editingTaskId) {
      await api.updateTask(editingTaskId, payload)
    } else {
      await api.createTask(payload)
    }
    setEditingTaskId(null)
    setTaskForm((current) => ({ ...current, title: '', notes: '', priority: 'normal', due_time: '' }))
    await load()
  }

  function editSchedule(schedule: Schedule) {
    navigate(`/gestor/dia/${schedule.date}`)
    setScheduleForm({
      user_id: String(schedule.user_id),
      station_id: String(schedule.station_id),
      break_start: schedule.break_start,
    })
    scheduleFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    scheduleFormRef.current?.querySelector('select')?.focus()
  }

  function editTask(task: Task) {
    setEditingTaskId(task.id)
    setTaskForm({
      user_id: String(task.user_id),
      title: task.title,
      notes: task.notes ?? '',
      priority: task.priority,
      due_time: task.due_time ?? '',
    })
    taskFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    taskFormRef.current?.querySelector('select')?.focus()
  }

  async function deleteSchedule(schedule: Schedule) {
    if (!window.confirm(`Excluir a escala de ${schedule.user_name}?`)) return
    await api.deleteSchedule(schedule.id)
    await load()
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return
    await api.deleteTask(task.id)
    if (editingTaskId === task.id) {
      setEditingTaskId(null)
      setTaskForm((current) => ({ ...current, title: '', notes: '', priority: 'normal', due_time: '' }))
    }
    await load()
  }

  return (
    <Shell session={session} onLogout={onLogout} title="Rotina diária" subtitle={formatDate(date)}>
      <section className="toolbar">
        <input type="date" value={date} onChange={(event) => navigate(`/gestor/dia/${event.target.value}`)} />
        <Link className="button secondary" to="/gestor/historico">
          <History size={18} /> Ver histórico
        </Link>
      </section>

      {day.error && <p className="error">{day.error}</p>}

      <section className="grid two">
        <form ref={scheduleFormRef} className="panel stack form-panel" onSubmit={createSchedule}>
          <h2>Adicionar ou editar escala</h2>
          <label>
            Data da escala
            <input type="date" value={date} onChange={(event) => navigate(`/gestor/dia/${event.target.value}`)} />
          </label>
          <label>
            Colaborador
            <select value={scheduleForm.user_id} onChange={(event) => setScheduleForm({ ...scheduleForm, user_id: event.target.value })}>
              <option value="">Selecione...</option>
              {collaborators.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </label>
          <label>
            Praça
            <select value={scheduleForm.station_id} onChange={(event) => setScheduleForm({ ...scheduleForm, station_id: event.target.value })}>
              <option value="">Selecione...</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </label>
          <label>
            Início do intervalo
            <input type="time" value={scheduleForm.break_start} onChange={(event) => setScheduleForm({ ...scheduleForm, break_start: event.target.value })} />
          </label>
          <button className="primary" disabled={!scheduleForm.user_id || !scheduleForm.station_id || !scheduleForm.break_start}>
            <Plus size={18} /> Salvar escala
          </button>
        </form>

        <form ref={taskFormRef} className="panel stack form-panel" onSubmit={createTask}>
          <h2>{editingTaskId ? 'Editar tarefa' : 'Adicionar tarefa'}</h2>
          <label>
            Data da tarefa
            <input type="date" value={date} onChange={(event) => navigate(`/gestor/dia/${event.target.value}`)} />
          </label>
          <label>
            Responsável
            <select value={taskForm.user_id} onChange={(event) => setTaskForm({ ...taskForm, user_id: event.target.value })}>
              {collaborators.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </label>
          <label>
            Tarefa
            <input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="Ex.: conferir etiquetas" required />
          </label>
          <label>
            Observação
            <textarea value={taskForm.notes} onChange={(event) => setTaskForm({ ...taskForm, notes: event.target.value })} rows={3} />
          </label>
          <label>
            Grau de urgência
            <select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as Priority })}>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>
          <label>
            Horário limite
            <input type="time" value={taskForm.due_time} onChange={(event) => setTaskForm({ ...taskForm, due_time: event.target.value })} />
          </label>
          <button className="primary" disabled={!taskForm.user_id || !taskForm.title.trim()}>
            <Plus size={18} /> {editingTaskId ? 'Salvar edição' : 'Criar tarefa'}
          </button>
        </form>
      </section>

      <section className="grid two">
        <div className="panel">
          <h2>Escalas</h2>
          <div className="list">
            {day.loading && <p>Carregando...</p>}
            {day.data?.schedules.map((schedule) => (
              <article className="row-card schedule-card" key={schedule.id}>
                <div className="card-details">
                  <strong>{schedule.user_name}</strong>
                  <DetailLine label="Praça">{schedule.station_name}</DetailLine>
                  {schedule.station_description && <DetailLine label="Descrição da praça">{schedule.station_description}</DetailLine>}
                </div>
                <time className="detail-line schedule-time">
                  <span className="detail-label">Intervalo</span>
                  <span><Clock3 size={16} /> {schedule.break_start} - {schedule.break_end}</span>
                </time>
                <div className="row-actions">
                  <button type="button" className="secondary compact" onClick={() => editSchedule(schedule)}>
                    <Edit3 size={16} /> Editar
                  </button>
                  <button type="button" className="danger-button compact" onClick={() => deleteSchedule(schedule)}>
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </article>
            ))}
            {!day.loading && day.data?.schedules.length === 0 && <p className="empty">Nenhuma escala criada.</p>}
          </div>
        </div>

        <div className="panel">
          <h2>Tarefas</h2>
          <TaskList tasks={day.data?.tasks ?? []} showOwner onEdit={editTask} onDelete={deleteTask} />
        </div>
      </section>
    </Shell>
  )
}

function UsersPage({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [users, setUsers] = useState<User[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', username: '', role: 'colaborador', pin: '', active: true })
  const [error, setError] = useState('')

  async function load() {
    setUsers(await api.users())
  }

  useEffect(() => {
    void load()
  }, [])


  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      if (editingId) {
        await api.updateUser(editingId, form)
      } else {
        await api.createUser(form)
      }
      setEditingId(null)
      setForm({ name: '', username: '', role: 'colaborador', pin: '', active: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário.')
    }
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Excluir o usuário ${user.name}? Ele será desativado e não conseguirá entrar.`)) return
    setError('')
    try {
      await api.deleteUser(user.id)
      if (editingId === user.id) {
        setEditingId(null)
        setForm({ name: '', username: '', role: 'colaborador', pin: '', active: true })
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário.')
    }
  }

  return (
    <Shell session={session} onLogout={onLogout} title="Colaboradores" subtitle="Cadastre equipe e gestores.">
      <section className="grid two">
        <form ref={formRef} className="panel stack form-panel entry-form" onSubmit={submit}>
          <h2>{editingId ? 'Editar usuário' : 'Novo usuário'}</h2>
          <label>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Usuário<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></label>
          <label>Papel<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="colaborador">Colaborador</option><option value="gestor">Gestor</option><option value="estoquista">Estoquista</option></select></label>
          <label>PIN<input value={form.pin} onChange={(event) => setForm({ ...form, pin: event.target.value })} inputMode="numeric" required={!editingId} placeholder={editingId ? 'Deixe vazio para manter' : ''} /></label>
          <label className="check-row"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Usuário ativo</label>
          {error && <p className="error">{error}</p>}
          <button className="primary"><Plus size={18} /> {editingId ? 'Salvar usuário' : 'Cadastrar'}</button>
        </form>
        <div className="panel">
          <h2>Equipe</h2>
          <div className="list">
            {users.map((user) => (
              <article className="row-card" key={user.id}>
                <div><strong>{user.name}</strong><span>@{user.username}</span></div>
                <span className="pill">{user.role === 'estoquista' ? 'Estoquista' : user.role === 'gestor' ? 'Gestor' : 'Colaborador'}</span>
                <button type="button" className="secondary compact" onClick={() => {
                  setEditingId(user.id)
                  setForm({ name: user.name, username: user.username, role: user.role, pin: '', active: user.active })
                  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  formRef.current?.querySelector('input')?.focus()
                }}>
                  <Edit3 size={16} /> Editar
                </button>
                <button type="button" className="danger-button compact" onClick={() => deleteUser(user)}>
                  <Trash2 size={16} /> Excluir
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  )
}

function StationsPage({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', active: true })
  const [error, setError] = useState('')

  async function load() {
    setStations((await api.stations()).filter((station) => station.active))
  }

  useEffect(() => {
    void load()
  }, [])


  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        active: Boolean(form.active),
      }
      if (editingId) {
        await api.updateStation(editingId, payload)
      } else {
        await api.createStation(payload)
      }
      setEditingId(null)
      setForm({ name: '', description: '', active: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar praça.')
    }
  }

  async function deleteStation(station: Station) {
    if (!window.confirm(`Excluir a praça ${station.name}? Ela deixará de aparecer no app.`)) return
    await api.deleteStation(station.id)
    if (editingId === station.id) {
      setEditingId(null)
      setForm({ name: '', description: '', active: true })
    }
    await load()
  }

  return (
    <Shell session={session} onLogout={onLogout} title="Praças" subtitle="Setores da cozinha para escala diária.">
      <section className="grid two">
        <form ref={formRef} className="panel stack form-panel entry-form" onSubmit={submit}>
          <h2>{editingId ? 'Editar praça' : 'Nova praça'}</h2>
          <label>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Chapa" required /></label>
          <label>Descrição<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} /></label>
          <label className="check-row"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Praça ativa</label>
          {error && <p className="error">{error}</p>}
          <button className="primary"><Plus size={18} /> {editingId ? 'Salvar praça' : 'Cadastrar praça'}</button>
        </form>
        <div className="panel">
          <h2>Praças ativas</h2>
          <div className="list">
            {stations.map((station) => (
              <article className="row-card" key={station.id}>
                <div><strong>{station.name}</strong><span>{station.description || 'Sem descrição'}</span></div>
                <span className="pill">{station.active ? 'ativa' : 'inativa'}</span>
                <button type="button" className="secondary compact" onClick={() => {
                  setEditingId(station.id)
                  setForm({ name: station.name, description: station.description ?? '', active: Boolean(station.active) })
                  setError('')
                  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  formRef.current?.querySelector('input')?.focus()
                }}>
                  <Edit3 size={16} /> Editar
                </button>
                <button type="button" className="danger-button compact" onClick={() => deleteStation(station)}>
                  <Trash2 size={16} /> Excluir
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  )
}

function NoticesPage({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', body: '', expires_at: '' })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setNotices(await api.notices())
  }

  useEffect(() => {
    void load()
  }, [])

  function choosePdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setError('')
    if (!file) {
      setPdfFile(null)
      return
    }
    if (file.type !== 'application/pdf') {
      setError('Selecione um arquivo PDF.')
      event.target.value = ''
      setPdfFile(null)
      return
    }
    if (file.size > maxPdfSize) {
      setError('O PDF deve ter até 3 MB.')
      event.target.value = ''
      setPdfFile(null)
      return
    }
    setPdfFile(file)
  }


  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        body: form.body,
        expires_at: form.expires_at || undefined,
        pdf_name: pdfFile?.name,
        pdf_data_url: pdfFile ? await readPdf(pdfFile) : undefined,
      }
      if (editingId) {
        await api.updateNotice(editingId, payload)
      } else {
        await api.createNotice(payload)
      }
      setEditingId(null)
      setForm({ title: '', body: '', expires_at: '' })
      setPdfFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar notícia.')
    } finally {
      setLoading(false)
    }
  }

  function editNotice(notice: Notice) {
    setEditingId(notice.id)
    setForm({
      title: notice.title,
      body: notice.body ?? '',
      expires_at: notice.expires_at ?? '',
    })
    setPdfFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector('input')?.focus()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ title: '', body: '', expires_at: '' })
    setPdfFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function deleteNotice(notice: Notice) {
    if (!window.confirm(`Excluir a notícia "${notice.title}"?`)) return
    if (editingId === notice.id) cancelEdit()
    await api.deleteNotice(notice.id)
    await load()
  }

  return (
    <Shell session={session} onLogout={onLogout} title="Mural" subtitle="Notícias e informações para toda a equipe.">
      <section className="grid two">
        <form ref={formRef} className="panel stack" onSubmit={submit}>
          <h2>{editingId ? 'Editar notícia' : 'Nova notícia'}</h2>
          <label>
            Título
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label>
            Informação
            <textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} rows={5} />
          </label>
          <label>
            Disponível até
            <input type="date" min={todayIso()} value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} />
          </label>
          <label>
            PDF para anexar
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={choosePdf} />
          </label>
          {editingId && !pdfFile && <p className="hint">Sem novo PDF selecionado. O anexo atual será mantido.</p>}
          {pdfFile && <p className="hint">Anexo selecionado: {pdfFile.name}</p>}
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={loading || !form.title.trim()}>
            <Plus size={18} /> {loading ? 'Salvando...' : editingId ? 'Salvar notícia' : 'Publicar'}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancelar edição
            </button>
          )}
        </form>
        <div className="panel">
          <h2>Notícias publicadas</h2>
          <NoticeList notices={notices} showExpiry onEdit={editNotice} onDelete={deleteNotice} />
        </div>
      </section>
    </Shell>
  )
}

function HistoryPage({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [date, setDate] = useState(todayIso())
  const [day, setDay] = useState<DayPayload | null>(null)

  useEffect(() => {
    void api.day(date).then(setDay)
  }, [date])

  return (
    <Shell session={session} onLogout={onLogout} title="Histórico" subtitle="Consulte escalas e conclusões por data.">
      <section className="toolbar">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <Link className="button secondary" to={`/gestor/dia/${date}`}>
          <CalendarDays size={18} /> Editar escala
        </Link>
      </section>
      <section className="grid two">
        <div className="panel">
          <h2>Escalas de {formatDate(date)}</h2>
          <div className="list">
            {day?.schedules.map((schedule) => (
              <article className="row-card" key={schedule.id}>
                <div className="card-details">
                  <strong>{schedule.user_name}</strong>
                  <DetailLine label="Praça">{schedule.station_name}</DetailLine>
                  {schedule.station_description && <DetailLine label="Descrição da praça">{schedule.station_description}</DetailLine>}
                </div>
                <time className="detail-line schedule-time">
                  <span className="detail-label">Intervalo</span>
                  <span>{schedule.break_start} - {schedule.break_end}</span>
                </time>
              </article>
            ))}
            {day?.schedules.length === 0 && <p className="empty">Sem escala nesse dia.</p>}
          </div>
        </div>
        <div className="panel">
          <h2>Tarefas</h2>
          <TaskList tasks={day?.tasks ?? []} showOwner />
        </div>
      </section>
    </Shell>
  )
}

function WorkerToday({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [day, setDay] = useState<DayPayload | null>(null)
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const date = todayIso()

  async function load() {
    const [dayPayload, pendingTasksPayload, noticesPayload] = await Promise.all([
      api.day(date),
      api.pendingTasks(date),
      api.notices(),
    ])
    setDay(dayPayload)
    setPendingTasks(pendingTasksPayload)
    setNotices(noticesPayload)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const schedules = day?.schedules ?? []
  const tasks = pendingTasks

  async function completeTask(id: number) {
    await api.completeTask(id)
    await load()
  }

  return (
    <Shell session={session} onLogout={onLogout} title="Meu dia" subtitle={formatDate(date)}>
      <section className="panel">
        <h2>Mural de notícias</h2>
        <NoticeList notices={notices} />
      </section>

      <section className="grid two">
        <div className="panel">
          <h2>Minha escala</h2>
          <div className="list">
            {schedules.map((schedule) => (
              <article className="focus-card" key={schedule.id}>
                <MapPin size={22} />
                <div className="card-details">
                  <DetailLine label="Praça">{schedule.station_name}</DetailLine>
                  {schedule.station_description && <DetailLine label="Descrição da praça">{schedule.station_description}</DetailLine>}
                  <DetailLine label="Intervalo">{schedule.break_start} - {schedule.break_end}</DetailLine>
                </div>
              </article>
            ))}
            {schedules.length === 0 && <p className="empty">Nenhuma escala para hoje.</p>}
          </div>
        </div>
        <div className="panel">
          <h2>Minhas tarefas</h2>
          <div className="list">
            {tasks.map((task) => (
              <article className={`task-card ${task.completed_at ? 'done' : ''}`} key={task.id}>
                <div className="card-details">
                  <strong>{task.title}</strong>
                  {task.notes && <DetailLine label="Observação">{task.notes}</DetailLine>}
                  <DetailLine label="Data">{formatDate(task.date)}</DetailLine>
                  <DetailLine label="Urgência">{priorityLabels[task.priority]}{task.due_time ? ` - limite ${task.due_time}` : ''}</DetailLine>
                  {isOverdue(task) && <small className="danger-text">Atrasada</small>}
                  {task.completed_at && <DetailLine label="Realizado em">{formatDateTime(task.completed_at)}</DetailLine>}
                </div>
                <button className={task.completed_at ? 'secondary' : 'primary'} onClick={() => completeTask(task.id)} disabled={Boolean(task.completed_at)}>
                  <CheckCircle2 size={18} /> {task.completed_at ? 'Ok' : 'Realizado'}
                </button>
              </article>
            ))}
            {tasks.length === 0 && <p className="empty">Nenhuma tarefa pendente.</p>}
          </div>
        </div>
      </section>
    </Shell>
  )
}



function StockPage({ session, onLogout, canManageCatalog = false }: { session: Session; onLogout: () => void; canManageCatalog?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null)
  const categoryFormRef = useRef<HTMLFormElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<StockCategory[]>([])
  const [orders, setOrders] = useState<StockOrder[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [form, setForm] = useState<{ name: string; category: ProductCategory; unit: string; observations: string; active: boolean }>({
    name: '',
    category: '',
    unit: '',
    observations: '',
    active: true,
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', active: true })
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [dateFilter, setDateFilter] = useState(todayIso())

  async function load() {
    const [productsPayload, categoriesPayload, ordersPayload] = await Promise.all([
      api.products(),
      api.stockCategories(),
      api.stockOrders(dateFilter),
    ])
    setProducts(productsPayload)
    setCategories(categoriesPayload)
    setOrders(ordersPayload)
    setForm((current) => ({ ...current, category: current.category || categoriesPayload[0]?.name || '' }))
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter])

  async function submitCategory(event: FormEvent) {
    event.preventDefault()
    setCategoryError('')
    try {
      if (editingCategoryId) {
        await api.updateStockCategory(editingCategoryId, { name: categoryForm.name.trim(), active: categoryForm.active })
      } else {
        await api.createStockCategory({ name: categoryForm.name.trim() })
      }
      setEditingCategoryId(null)
      setCategoryForm({ name: '', active: true })
      await load()
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Erro ao salvar categoria.')
    }
  }

  function editCategory(category: StockCategory) {
    setEditingCategoryId(category.id)
    setCategoryForm({ name: category.name, active: Boolean(category.active) })
    setCategoryError('')
    categoryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    categoryFormRef.current?.querySelector('input')?.focus()
  }

  function cancelCategoryEdit() {
    setEditingCategoryId(null)
    setCategoryForm({ name: '', active: true })
    setCategoryError('')
  }

  async function deleteCategory(category: StockCategory) {
    if (!window.confirm('Inativar a categoria "' + category.name + '"? Produtos já cadastrados continuam no histórico.')) return
    await api.deleteStockCategory(category.id)
    if (editingCategoryId === category.id) cancelCategoryEdit()
    await load()
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        unit: form.unit.trim(),
        observations: form.observations.trim() || undefined,
        active: form.active,
      }
      if (editingId) {
        await api.updateProduct(editingId, payload)
      } else {
        await api.createProduct({ name: payload.name, category: payload.category, unit: payload.unit, observations: payload.observations })
      }
      setEditingId(null)
      setForm({ name: '', category: categories[0]?.name || '', unit: '', observations: '', active: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto.')
    }
  }

  function editProduct(product: Product) {
    setEditingId(product.id)
    setForm({ name: product.name, category: product.category, unit: product.unit, observations: product.observations ?? '', active: Boolean(product.active) })
    setError('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector('input')?.focus()
  }

  function cancelProductEdit() {
    setEditingId(null)
    setForm({ name: '', category: categories[0]?.name || '', unit: '', observations: '', active: true })
    setError('')
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm('Inativar o produto "' + product.name + '"? Ele sairá da lista sem apagar histórico.')) return
    await api.deleteProduct(product.id)
    if (editingId === product.id) cancelProductEdit()
    await load()
  }

  async function changeStatus(order: StockOrder, status: StockOrderStatus) {
    await api.updateStockOrderStatus(order.id, status)
    await load()
  }

  const pendingCount = orders.filter((order) => order.status === 'pendente').length
  const separatédCount = orders.filter((order) => order.status === 'separado').length
  const deliveredCount = orders.filter((order) => order.status === 'entregue').length

  return (
    <Shell session={session} onLogout={onLogout} title="Pedidos" subtitle="Pedidos recebidos, categorias e cadastro de produtos.">
      <section className="metrics stock-metrics">
        <article className="metric warning"><span>Pedidos pendentes</span><strong>{pendingCount}</strong></article>
        <article className="metric"><span>Separados</span><strong>{separatédCount}</strong></article>
        <article className="metric success"><span>Entregues</span><strong>{deliveredCount}</strong></article>
        <article className="metric"><span>Produtos ativos</span><strong>{products.length}</strong></article>
      </section>

      <section className="grid two stock-layout">
        <div className="panel stock-orders-panel">
          <div className="panel-title-row">
            <h2>Pedidos recebidos</h2>
            <label className="compact-label">
              Data
              <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
            </label>
          </div>
          <div className="list">
            {orders.map((order) => (
              <StockOrderCard key={order.id} order={order} canManage onStatusChange={changeStatus} />
            ))}
            {orders.length === 0 && <p className="empty">Nenhum pedido recebido.</p>}
          </div>
        </div>

        {canManageCatalog && (
        <div className="panel stock-management-panel">
          <form ref={categoryFormRef} className="stack" onSubmit={submitCategory}>
            <h2>{editingCategoryId ? 'Editar categoria' : 'Nova categoria'}</h2>
            <label>
              Nome da categoria
              <input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Ex.: Bebidas" required />
            </label>
            {editingCategoryId && (
              <label className="check-row">
                <input type="checkbox" checked={categoryForm.active} onChange={(event) => setCategoryForm({ ...categoryForm, active: event.target.checked })} /> Categoria ativa
              </label>
            )}
            {categoryError && <p className="error">{categoryError}</p>}
            <button className="primary" disabled={!categoryForm.name.trim()}>
              <Plus size={18} /> {editingCategoryId ? 'Salvar categoria' : 'Cadastrar categoria'}
            </button>
            {editingCategoryId && <button type="button" className="secondary" onClick={cancelCategoryEdit}>Cancelar edição</button>}
          </form>

          <div className="stock-section">
            <h2>Categorias ativas</h2>
            <div className="stock-category-list">
              {categories.map((category) => (
                <article className="stock-category-card" key={category.id}>
                  <strong>{category.name}</strong>
                  <div className="row-actions">
                    <button type="button" className="secondary compact" onClick={() => editCategory(category)}>
                      <Edit3 size={16} /> Editar
                    </button>
                    <button type="button" className="danger-button compact" onClick={() => deleteCategory(category)}>
                      <Trash2 size={16} /> Inativar
                    </button>
                  </div>
                </article>
              ))}
              {categories.length === 0 && <p className="empty">Nenhuma categoria cadastrada.</p>}
            </div>
          </div>

          <form ref={formRef} className="stack stock-section" onSubmit={submitProduct}>
            <h2>{editingId ? 'Editar produto' : 'Novo produto'}</h2>
            <label>
              Nome do produto
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Arroz" required />
            </label>
            <label>
              Categoria
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required>
                <option value="">Selecione...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              Unidade de medida
              <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="un, kg, pacote, litro, caixa" required />
            </label>
            <label>
              Observações do produto
              <textarea value={form.observations} onChange={(event) => setForm({ ...form, observations: event.target.value })} rows={3} placeholder="Ex.: marca preferida, tamanho, uso ou orientação." />
            </label>
            {editingId && (
              <label className="check-row">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Produto ativo
              </label>
            )}
            {error && <p className="error">{error}</p>}
            <button className="primary" disabled={!form.name.trim() || !form.category.trim() || !form.unit.trim()}>
              <Plus size={18} /> {editingId ? 'Salvar produto' : 'Cadastrar produto'}
            </button>
            {editingId && <button type="button" className="secondary" onClick={cancelProductEdit}>Cancelar edição</button>}
          </form>

          <div className="stock-section">
            <h2>Produtos ativos</h2>
            <div className="list">
              {products.map((product) => (
                <article className="row-card product-row-card" key={product.id}>
                  <strong className="product-row-name">{product.name}</strong>
                  <div className="row-actions icon-actions">
                    <button type="button" className="secondary icon-button" onClick={() => editProduct(product)} aria-label={`Editar ${product.name}`} title="Editar">
                      <Edit3 size={17} />
                    </button>
                    <button type="button" className="danger-button icon-button" onClick={() => deleteProduct(product)} aria-label={`Inativar ${product.name}`} title="Inativar">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
              {products.length === 0 && <p className="empty">Nenhum produto cadastrado.</p>}
            </div>
          </div>
        </div>
        )}
      </section>
    </Shell>
  )
}

const inventoryStatusLabels: Record<InventoryCheckStatus, string> = {
  ok: 'Ok',
  pedir: 'Pedir',
  produzir: 'Produzir',
}

function InventoryCheckPage({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const sectorFormRef = useRef<HTMLFormElement>(null)
  const [items, setItems] = useState<InventoryCheckItem[]>([])
  const [sectors, setSectors] = useState<InventoryCheckSector[]>([])
  const [checkDate, setCheckDate] = useState(todayIso())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingSectorId, setEditingSectorId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', sector_id: '', active: true })
  const [sectorForm, setSectorForm] = useState({ name: '', active: true })
  const [sectorFilter, setSectorFilter] = useState('todos')
  const [error, setError] = useState('')
  const [sectorError, setSectorError] = useState('')

  async function load() {
    const [itemsPayload, sectorsPayload] = await Promise.all([
      api.inventoryCheckItems(checkDate),
      api.inventoryCheckSectors(),
    ])
    setItems(itemsPayload)
    setSectors(sectorsPayload)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkDate])

  async function submitSector(event: FormEvent) {
    event.preventDefault()
    setSectorError('')
    try {
      if (editingSectorId) {
        await api.updateInventoryCheckSector(editingSectorId, { name: sectorForm.name.trim(), active: sectorForm.active })
      } else {
        await api.createInventoryCheckSector({ name: sectorForm.name.trim() })
      }
      setEditingSectorId(null)
      setSectorForm({ name: '', active: true })
      await load()
    } catch (err) {
      setSectorError(err instanceof Error ? err.message : 'Erro ao salvar setor.')
    }
  }

  function editSector(sector: InventoryCheckSector) {
    setEditingSectorId(sector.id)
    setSectorForm({ name: sector.name, active: Boolean(sector.active) })
    setSectorError('')
    sectorFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    sectorFormRef.current?.querySelector('input')?.focus()
  }

  function cancelSectorEdit() {
    setEditingSectorId(null)
    setSectorForm({ name: '', active: true })
    setSectorError('')
  }

  async function deleteSector(sector: InventoryCheckSector) {
    if (!window.confirm('Excluir o setor/freezer "' + sector.name + '"? Os produtos continuam cadastrados, mas ficam sem setor.')) return
    await api.deleteInventoryCheckSector(sector.id)
    if (editingSectorId === sector.id) cancelSectorEdit()
    await load()
  }

  async function submitItem(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const payload = { name: form.name.trim(), sector_id: form.sector_id ? Number(form.sector_id) : null, active: form.active }
      if (editingId) {
        await api.updateInventoryCheckItem(editingId, payload)
      } else {
        await api.createInventoryCheckItem({ name: payload.name, sector_id: payload.sector_id })
      }
      setEditingId(null)
      setForm({ name: '', sector_id: '', active: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar item.')
    }
  }

  function editItem(item: InventoryCheckItem) {
    setEditingId(item.id)
    setForm({ name: item.name, sector_id: item.sector_id ? String(item.sector_id) : '', active: Boolean(item.active) })
    setError('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector('input')?.focus()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ name: '', sector_id: '', active: true })
    setError('')
  }

  async function deleteItem(item: InventoryCheckItem) {
    if (!window.confirm('Excluir o item "' + item.name + '" da conferência?')) return
    await api.deleteInventoryCheckItem(item.id)
    if (editingId === item.id) cancelEdit()
    await load()
  }

  async function changeItemStatus(item: InventoryCheckItem, status: InventoryCheckStatus) {
    const previous = items
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status } : entry)))
    try {
      await api.updateInventoryCheckItemStatus(item.id, status, checkDate)
    } catch (err) {
      setItems(previous)
      setError(err instanceof Error ? err.message : 'Erro ao marcar conferência.')
    }
  }

  const visibleItems = useMemo(() => {
    if (sectorFilter === 'todos') return items
    if (sectorFilter === 'sem-setor') return items.filter((item) => !item.sector_id)
    return items.filter((item) => item.sector_id === Number(sectorFilter))
  }, [items, sectorFilter])

  const groupedItems = useMemo(() => {
    return visibleItems.reduce<Record<string, InventoryCheckItem[]>>((groups, item) => {
      const sector = item.sector_name || 'Sem setor'
      groups[sector] = groups[sector] ?? []
      groups[sector].push(item)
      return groups
    }, {})
  }, [visibleItems])

  const reportItems = useMemo(() => items.filter((item) => item.status === 'pedir' || item.status === 'produzir'), [items])
  const reportByStatus = useMemo(() => {
    return reportItems.reduce<Record<InventoryCheckStatus, InventoryCheckItem[]>>(
      (groups, item) => {
        if (item.status) groups[item.status].push(item)
        return groups
      },
      { ok: [], pedir: [], produzir: [] },
    )
  }, [reportItems])

  return (
    <Shell session={session} onLogout={onLogout} title="Conferência" subtitle="Checklist dos produtos que temos na casa e do que precisa pedir ou produzir.">
      <section className="panel inventory-report inventory-report-summary">
        <div className="panel-title-row inventory-report-title">
          <h2>Relatório do dia</h2>
          <span>{formatDate(checkDate)}</span>
        </div>
        {reportItems.length === 0 ? (
          <p className="empty">Nenhum item marcado para pedir ou produzir nesta data.</p>
        ) : (
          <div className="inventory-report-grid compact-report-grid">
            {(['pedir', 'produzir'] as InventoryCheckStatus[]).map((status) => (
              <article className={`inventory-report-card modern-report-card status-${status}`} key={status}>
                <div className="report-card-header">
                  <strong>{inventoryStatusLabels[status]}</strong>
                  <span>{reportByStatus[status].length}</span>
                </div>
                {reportByStatus[status].length === 0 ? (
                  <p>Nada marcado.</p>
                ) : (
                  <ul>
                    {reportByStatus[status].map((item) => (
                      <li key={item.id}>
                        <strong>{item.name}</strong>
                        <span>{item.sector_name || 'Sem setor'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid two inventory-layout">
        <div className="panel inventory-manage-panel">
          <form ref={formRef} className="stack inventory-compact-form" onSubmit={submitItem}>
            <h2>{editingId ? 'Editar produto' : 'Novo produto'}</h2>
            <label>
              Produto
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Arroz, ovos, café" required />
            </label>
            <label>
              Setor/freezer
              <select value={form.sector_id} onChange={(event) => setForm({ ...form, sector_id: event.target.value })}>
                <option value="">Sem setor</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </label>
            {editingId && (
              <label className="check-row">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Item ativo
              </label>
            )}
            {error && <p className="error">{error}</p>}
            <button className="primary" disabled={!form.name.trim()}>
              <Plus size={18} /> {editingId ? 'Salvar produto' : 'Cadastrar produto'}
            </button>
            {editingId && <button type="button" className="secondary" onClick={cancelEdit}>Cancelar edição</button>}
          </form>

          <form ref={sectorFormRef} className="stack inventory-compact-form stock-section" onSubmit={submitSector}>
            <h2>{editingSectorId ? 'Editar setor/freezer' : 'Novo setor/freezer'}</h2>
            <label>
              Nome do setor/freezer
              <input value={sectorForm.name} onChange={(event) => setSectorForm({ ...sectorForm, name: event.target.value })} placeholder="Ex.: Freezer 1" required />
            </label>
            {editingSectorId && (
              <label className="check-row">
                <input type="checkbox" checked={sectorForm.active} onChange={(event) => setSectorForm({ ...sectorForm, active: event.target.checked })} /> Setor ativo
              </label>
            )}
            {sectorError && <p className="error">{sectorError}</p>}
            <button className="primary" disabled={!sectorForm.name.trim()}>
              <Plus size={18} /> {editingSectorId ? 'Salvar setor' : 'Cadastrar setor'}
            </button>
            {editingSectorId && <button type="button" className="secondary" onClick={cancelSectorEdit}>Cancelar edição</button>}
          </form>

          <div className="inventory-sector-list">
            {sectors.map((sector) => (
              <article className="inventory-sector-card" key={sector.id}>
                <strong>{sector.name}</strong>
                <div className="row-actions icon-actions">
                  <button type="button" className="secondary icon-button" onClick={() => editSector(sector)} aria-label={`Editar ${sector.name}`} title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button type="button" className="danger-button icon-button" onClick={() => deleteSector(sector)} aria-label={`Excluir ${sector.name}`} title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="panel inventory-panel">
          <div className="panel-title-row inventory-filter-row">
            <h2>Checklist</h2>
            <label className="compact-label">
              Data
              <input type="date" value={checkDate} onChange={(event) => setCheckDate(event.target.value)} />
            </label>
            <label className="compact-label">
              Freezer
              <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
                <option value="todos">Todos</option>
                <option value="sem-setor">Sem setor</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="inventory-list">
            {Object.entries(groupedItems).map(([sector, sectorItems]) => (
              <section className="inventory-sector-group" key={sector}>
                <h3>{sector}</h3>
                {sectorItems.map((item) => (
                  <article className="inventory-item-card" key={item.id}>
                    <div className="inventory-item-main">
                      <strong>{item.name}</strong>
                    </div>
                    <div className="inventory-status-options" aria-label={`Status de ${item.name}`}>
                      {(['ok', 'pedir', 'produzir'] as InventoryCheckStatus[]).map((status) => (
                        <label className={`inventory-check-option status-${status}`} key={status} title={inventoryStatusLabels[status]}>
                          <input
                            type="radio"
                            name={`inventory-${checkDate}-${item.id}`}
                            checked={item.status === status}
                            onChange={() => changeItemStatus(item, status)}
                          />
                          {inventoryStatusLabels[status]}
                        </label>
                      ))}
                    </div>
                    <div className="row-actions icon-actions">
                      <button type="button" className="secondary icon-button" onClick={() => editItem(item)} aria-label={`Editar ${item.name}`} title="Editar">
                        <Edit3 size={16} />
                      </button>
                      <button type="button" className="danger-button icon-button" onClick={() => deleteItem(item)} aria-label={`Excluir ${item.name}`} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            ))}
            {visibleItems.length === 0 && <p className="empty">Nenhum item neste filtro.</p>}
          </div>
        </div>
      </section>    </Shell>
  )
}
const maxTechnicalSheetImageSize = 1.5 * 1024 * 1024

function readTechnicalSheetImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a foto.'))
    reader.readAsDataURL(file)
  })
}

type TechnicalIngredient = {
  product: string
  quantity: string
  unit: string
}

function emptyTechnicalIngredient(): TechnicalIngredient {
  return { product: '', quantity: '', unit: '' }
}

function parseTechnicalIngredients(value: string): TechnicalIngredient[] {
  try {
    const parsed = JSON.parse(value) as unknown
    if (Array.isArray(parsed)) {
      const rows = parsed
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const candidate = item as Record<string, unknown>
          return {
            product: typeof candidate.product === 'string' ? candidate.product : '',
            quantity: typeof candidate.quantity === 'string' ? candidate.quantity : '',
            unit: typeof candidate.unit === 'string' ? candidate.unit : '',
          }
        })
        .filter((item): item is TechnicalIngredient => Boolean(item?.product.trim()))
      if (rows.length > 0) return rows
    }
  } catch {
    // Fichas antigas podem conter ingredientes em texto livre.
  }
  return [{ product: value.trim(), quantity: '', unit: '' }]
}
function TechnicalSheetsPage({ session, onLogout, canManage = false }: { session: Session; onLogout: () => void; canManage?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [sheets, setSheets] = useState<TechnicalSheet[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', ingredients: [emptyTechnicalIngredient()], preparation: '', photo_data_url: null as string | null })
  const [expandedPhoto, setExpandedPhoto] = useState<TechnicalSheet | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TechnicalSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  async function load() {
    setLoading(true)
    try {
      setSheets(await api.technicalSheets())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar as fichas técnicas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function clearForm() {
    setEditingId(null)
    setForm({ name: '', ingredients: [emptyTechnicalIngredient()], preparation: '', photo_data_url: null })
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    setShowPhotoOptions(false)
  }

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Selecione uma imagem JPG, PNG ou WEBP.')
      event.target.value = ''
      return
    }
    if (file.size > maxTechnicalSheetImageSize) {
      setError('A foto deve ter até 1,5 MB.')
      event.target.value = ''
      return
    }
    try {
      const photoDataUrl = await readTechnicalSheetImage(file)
      setForm((current) => ({ ...current, photo_data_url: photoDataUrl }))
      setShowPhotoOptions(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ler a foto.')
      event.target.value = ''
    }
  }


  function updateIngredient(index: number, field: keyof TechnicalIngredient, value: string) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) => (
        ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
      )),
    }))
  }

  function addIngredient() {
    setForm((current) => ({ ...current, ingredients: [...current.ingredients, emptyTechnicalIngredient()] }))
  }

  function removeIngredient(index: number) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.length === 1
        ? [emptyTechnicalIngredient()]
        : current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }))
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const ingredientRows = form.ingredients
        .map((ingredient) => ({
          product: ingredient.product.trim(),
          quantity: ingredient.quantity.trim(),
          unit: ingredient.unit.trim(),
        }))
        .filter((ingredient) => ingredient.product)
      if (ingredientRows.length === 0) {
        setError('Adicione pelo menos um ingrediente.')
        setSaving(false)
        return
      }
      const payload = {
        name: form.name.trim(),
        ingredients: JSON.stringify(ingredientRows),
        preparation: form.preparation.trim(),
        photo_data_url: form.photo_data_url,
      }
      if (editingId) {
        await api.updateTechnicalSheet(editingId, { ...payload, active: true })
      } else {
        await api.createTechnicalSheet(payload)
      }
      clearForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a ficha técnica.')
    } finally {
      setSaving(false)
    }
  }

  function editSheet(sheet: TechnicalSheet) {
    setEditingId(sheet.id)
    setForm({
      name: sheet.name,
      ingredients: parseTechnicalIngredients(sheet.ingredients),
      preparation: sheet.preparation,
      photo_data_url: sheet.photo_data_url,
    })
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    setShowPhotoOptions(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function requestDeleteSheet(sheet: TechnicalSheet) {
    setError('')
    setDeleteTarget(sheet)
  }

  async function confirmDeleteSheet() {
    const sheet = deleteTarget
    if (!sheet) return
    setError('')
    try {
      await api.deleteTechnicalSheet(sheet.id)
      setDeleteTarget(null)
      if (editingId === sheet.id) clearForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir a ficha tecnica.')
    }
  }
  const visibleSheets = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR')
    if (!query) return sheets
    return sheets.filter((sheet) => (
      [sheet.name, sheet.ingredients].join(' ').toLocaleLowerCase('pt-BR').includes(query)
    ))
  }, [sheets, searchTerm])

  const cards = (
    <div className="technical-sheets-grid">
      {visibleSheets.map((sheet) => (
        <article className="technical-sheet-card" key={sheet.id}>
          {sheet.photo_data_url ? (
            <button
              type="button"
              className="technical-sheet-photo"
              onClick={() => setExpandedPhoto(sheet)}
              aria-label={`Ampliar foto de ${sheet.name}`}
              title="Ampliar foto"
            >
              <img src={sheet.photo_data_url} alt={`Foto de ${sheet.name}`} />
            </button>
          ) : (
            <div className="technical-sheet-photo technical-sheet-photo-placeholder">
              <ImagePlus size={24} />
              <span>Sem foto</span>
            </div>
          )}
          <div className="technical-sheet-content">
            <div className="technical-sheet-heading">
              <h2>{sheet.name}</h2>
              {canManage && (
                <div className="row-actions technical-sheet-actions">
                  <button type="button" className="secondary icon-button" onClick={() => editSheet(sheet)} aria-label={`Editar ${sheet.name}`} title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button type="button" className="danger-button icon-button" onClick={() => requestDeleteSheet(sheet)} aria-label={`Excluir ${sheet.name}`} title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <section className="technical-sheet-section">
              <div className="technical-ingredients-list">
                {parseTechnicalIngredients(sheet.ingredients).map((ingredient, index) => (
                  <div className="technical-ingredient-row" key={`${sheet.id}-${index}`}>
                    <span>{ingredient.product || '-'}</span>
                    <span>{ingredient.quantity || '-'}</span>
                    <span>{ingredient.unit || '-'}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="technical-sheet-section">
              <h3>Modo de preparo</h3>
              <p>{sheet.preparation}</p>
            </section>
          </div>
        </article>
      ))}
      {!loading && sheets.length === 0 && <p className="empty">Nenhuma ficha tecnica cadastrada.</p>}
      {!loading && sheets.length > 0 && visibleSheets.length === 0 && <p className="empty">Nenhuma ficha encontrada para essa busca.</p>}
      {loading && <p className="empty">Carregando fichas tecnicas...</p>}
    </div>
  )
  const formContent = (
    <>
      <h2>{editingId ? 'Editar ficha tecnica' : 'Nova ficha tecnica'}</h2>
      <label>
        Nome do produto
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Bolo de chocolate" required />
      </label>
      <label>
        Foto do produto
        <div className="technical-photo-picker">
          <button
            type="button"
            className="secondary technical-photo-trigger"
            onClick={() => setShowPhotoOptions((current) => !current)}
            aria-expanded={showPhotoOptions}
            aria-haspopup="menu"
          >
            <ImagePlus size={18} />
            <span>{form.photo_data_url ? 'Trocar foto' : 'Adicionar foto'}</span>
          </button>
          {showPhotoOptions && (
            <div className="technical-photo-options" role="menu">
              <button type="button" className="secondary compact" role="menuitem" onClick={() => cameraInputRef.current?.click()}>
                <Camera size={16} />
                Tirar foto
              </button>
              <button type="button" className="secondary compact" role="menuitem" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={16} />
                Escolher da galeria
              </button>
            </div>
          )}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={choosePhoto} hidden />
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} hidden />
        </div>
      </label>
      {form.photo_data_url && (
        <div className="technical-sheet-preview">
          <img src={form.photo_data_url} alt="Previa da ficha tecnica" />
          <button type="button" className="secondary compact" onClick={() => setForm({ ...form, photo_data_url: null })}>Remover foto</button>
        </div>
      )}
      <div className="technical-ingredient-editor">
        <span className="form-label">Ingredientes</span>
        {form.ingredients.map((ingredient, index) => (
          <div className="technical-ingredient-input-row" key={index}>
            <input value={ingredient.product} onChange={(event) => updateIngredient(index, 'product', event.target.value)} placeholder="Produto" aria-label={`Produto do ingrediente ${index + 1}`} required={index === 0} />
            <input value={ingredient.quantity} onChange={(event) => updateIngredient(index, 'quantity', event.target.value)} placeholder="Qtd." aria-label={`Quantidade do ingrediente ${index + 1}`} />
            <input value={ingredient.unit} onChange={(event) => updateIngredient(index, 'unit', event.target.value)} placeholder="Unid." aria-label={`Unidade do ingrediente ${index + 1}`} />
            <button type="button" className="danger-button icon-button" onClick={() => removeIngredient(index)} aria-label={`Remover ingrediente ${index + 1}`} title="Remover ingrediente" disabled={form.ingredients.length === 1}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button type="button" className="secondary compact technical-add-ingredient" onClick={addIngredient}>
          <Plus size={16} /> Adicionar ingrediente
        </button>
      </div>
      <label>
        Modo de preparo
        <textarea value={form.preparation} onChange={(event) => setForm({ ...form, preparation: event.target.value })} rows={7} placeholder="Descreva as etapas do preparo." required />
      </label>
      <button className="primary" disabled={saving || !form.name.trim() || !form.ingredients.some((ingredient) => ingredient.product.trim()) || !form.preparation.trim()}>
        <Plus size={18} /> {saving ? 'Salvando...' : editingId ? 'Salvar ficha' : 'Cadastrar ficha'}
      </button>
      {editingId && <button type="button" className="secondary" onClick={clearForm}>Cancelar edicao</button>}
    </>
  )
  return (
    <Shell session={session} onLogout={onLogout} title="Fichas técnicas" subtitle={canManage ? 'Cadastre receitas e orientações da cozinha.' : 'Consulte ingredientes e modo de preparo.'}>
      {error && <p className="error">{error}</p>}
      {canManage ? (
        <section className="grid two technical-sheets-layout">
          {!editingId && (
            <form className="panel stack form-panel technical-sheet-form" onSubmit={submit}>
              {formContent}
            </form>
          )}
          <section className="panel technical-sheets-panel">
            <h2>Fichas cadastradas</h2>
            {cards}
          </section>
        </section>      ) : (
        <section className="technical-sheets-panel technical-sheets-view">
          <h2>Fichas cadastradas</h2>
          <div className="technical-search-bar" role="search">
            <div className="technical-search-input-wrap">
              {!searchTerm && <Search size={18} aria-hidden="true" />}
              <input
                className={`technical-search-input${searchTerm ? ' technical-search-input-with-value' : ' technical-search-input-with-icon'}`}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar ficha técnica ou ingrediente"
                aria-label="Buscar ficha técnica ou ingrediente"
              />
              {searchTerm && (
                <button type="button" className="technical-search-clear" onClick={() => setSearchTerm('')} aria-label="Limpar busca" title="Limpar busca">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          {cards}
        </section>
      )}

      {editingId && (
        <div className="technical-modal-backdrop" role="presentation" onClick={clearForm}>
          <form className="technical-modal technical-sheet-modal stack" role="dialog" aria-modal="true" aria-labelledby="technical-edit-title" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
            <div className="technical-modal-header">
              <div>
                <p className="eyebrow">Fichas tecnicas</p>
                <h2 id="technical-edit-title">Editar ficha tecnica</h2>
              </div>
              <button type="button" className="secondary icon-button" onClick={clearForm} aria-label="Fechar edicao" title="Fechar">
                <X size={18} />
              </button>
            </div>
            {formContent}
          </form>
        </div>
      )}
      {deleteTarget && (
        <div className="technical-modal-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}>
          <section className="technical-modal technical-delete-modal" role="dialog" aria-modal="true" aria-labelledby="technical-delete-title" onClick={(event) => event.stopPropagation()}>
            <div className="technical-modal-header">
              <div>
                <p className="eyebrow">Confirmar exclusao</p>
                <h2 id="technical-delete-title">Excluir ficha tecnica?</h2>
              </div>
              <button type="button" className="secondary icon-button" onClick={() => setDeleteTarget(null)} aria-label="Fechar confirmacao" title="Fechar">
                <X size={18} />
              </button>
            </div>
            <p className="technical-delete-message">A ficha <strong>{deleteTarget.name}</strong> deixara de aparecer para os colaboradores.</p>
            {error && <p className="error">{error}</p>}
            <div className="technical-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button type="button" className="danger-button" onClick={() => void confirmDeleteSheet()}><Trash2 size={16} /> Excluir ficha</button>
            </div>
          </section>
        </div>
      )}

      {expandedPhoto?.photo_data_url && (
        <div className="technical-photo-lightbox" role="dialog" aria-modal="true" aria-label={`Foto ampliada de ${expandedPhoto.name}`} onClick={() => setExpandedPhoto(null)}>
          <button type="button" className="technical-photo-lightbox-close" onClick={() => setExpandedPhoto(null)} aria-label="Fechar foto">
            <X size={22} />
          </button>
          <img src={expandedPhoto.photo_data_url} alt={expandedPhoto.name} onClick={(event) => event.stopPropagation()} />
        </div>
      )}    </Shell>
  )
}
function MenuPage({ session, onLogout, canManage = false }: { session: Session; onLogout: () => void; canManage?: boolean }) {
  const [menus, setMenus] = useState<BreakfastMenu[]>([])
  const [selectedDay, setSelectedDay] = useState<MenuDay>(currentMenuDay())
  const [selectedMenuId, setSelectedMenuId] = useState('')
  const [editingItem, setEditingItem] = useState<BreakfastMenuItem | null>(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [editForm, setEditForm] = useState<Pick<BreakfastMenuItem, 'section' | 'item' | 'values'>>({
    section: '',
    item: '',
    values: { segunda: '', terca: '', quarta: '', quinta: '', sexta: '', sabado: '', domingo: '' },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadMenus() {
    setLoading(true)
    setError('')
    try {
      const payload = await api.breakfastMenus()
      setMenus(payload)
      setSelectedMenuId((current) => current || payload[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o cardápio.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMenus()
  }, [])

  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) ?? menus[0]
  const selectedDayLabel = menuDays.find((day) => day.key === selectedDay)?.label ?? 'Hoje'
  const groupedItems = useMemo(() => {
    if (!selectedMenu) return {}
    return selectedMenu.items.reduce<Record<string, BreakfastMenuItem[]>>((groups, item) => {
      groups[item.section] = groups[item.section] ?? []
      groups[item.section].push(item)
      return groups
    }, {})
  }, [selectedMenu])

  function startEditingMenuItem(item: BreakfastMenuItem) {
    setEditingItem(item)
    setEditForm({ section: item.section, item: item.item, values: { ...item.values } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startCreatingMenuItem() {
    setEditingItem(null)
    setCreatingItem(true)
    setEditForm({ section: '', item: '', values: { segunda: '', terca: '', quarta: '', quinta: '', sexta: '', sabado: '', domingo: '' } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEditingMenuItem() {
    setEditingItem(null)
    setCreatingItem(false)
    setEditForm({ section: '', item: '', values: { segunda: '', terca: '', quarta: '', quinta: '', sexta: '', sabado: '', domingo: '' } })
  }

  async function saveMenuItem(event: FormEvent) {
    event.preventDefault()
    if (!selectedMenu) return
    setError('')
    try {
      if (editingItem) {
        await api.updateBreakfastMenuItem(editingItem.id, { ...editForm, active: true })
      } else if (creatingItem) {
        await api.createBreakfastMenuItem({ menu_id: selectedMenu.id, ...editForm })
      }
      cancelEditingMenuItem()
      await loadMenus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar item do cardápio.')
    }
  }

  async function deleteMenuItem(item: BreakfastMenuItem) {
    if (!window.confirm(`Excluir "${item.item}" do cardápio? Ele deixará de aparecer para os colaboradores.`)) return
    setError('')
    try {
      await api.deleteBreakfastMenuItem(item.id)
      if (editingItem?.id === item.id) cancelEditingMenuItem()
      await loadMenus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir item do cardápio.')
    }
  }

  return (
    <Shell session={session} onLogout={onLogout} title="Cardápio" subtitle="Café da manhã por dia da semana.">
      {error && <p className="error">{error}</p>}

      {canManage && (editingItem || creatingItem) && (
        <form className="panel stack menu-edit-form" onSubmit={saveMenuItem}>
          <h2>{editingItem ? 'Editar item do cardápio' : 'Novo item do cardápio'}</h2>
          <section className="grid two">
            <label>
              Praça ou seção
              <input value={editForm.section} onChange={(event) => setEditForm({ ...editForm, section: event.target.value })} required />
            </label>
            <label>
              Nome do item
              <input value={editForm.item} onChange={(event) => setEditForm({ ...editForm, item: event.target.value })} required />
            </label>
          </section>
          <section className="menu-edit-days">
            {menuDays.map((day) => (
              <label key={day.key}>
                {day.label}
                <input value={editForm.values[day.key]} onChange={(event) => setEditForm({ ...editForm, values: { ...editForm.values, [day.key]: event.target.value } })} required />
              </label>
            ))}
          </section>
          <div className="row-actions">
            <button className="primary"><CheckCircle2 size={18} /> {editingItem ? 'Salvar item' : 'Incluir item'}</button>
            <button type="button" className="secondary" onClick={cancelEditingMenuItem}>Cancelar</button>
          </div>
        </form>
      )}

      <section className="panel menu-hero">
        <div>
          <p className="eyebrow">Cardápio do dia</p>
          <h2>{selectedMenu ? `${selectedDayLabel} - ${selectedMenu.title}` : 'Cardápio'}</h2>
        </div>
        <div className="menu-hero-actions">
          <label className="compact-label menu-hotel-select">
            Unidade
            <select value={selectedMenu?.id ?? ''} onChange={(event) => setSelectedMenuId(event.target.value)}>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>{menu.title}</option>
              ))}
            </select>
          </label>
          {canManage && selectedMenu && (
            <button type="button" className="primary compact" onClick={startCreatingMenuItem}>
              <Plus size={16} /> Novo item
            </button>
          )}
        </div>
      </section>

      <section className="panel menu-day-panel">
        <div className="segmented-control menu-day-tabs" aria-label="Selecionar dia do cardápio">
          {menuDays.map((day) => (
            <button type="button" key={day.key} className={selectedDay === day.key ? 'active' : ''} onClick={() => setSelectedDay(day.key)}>
              {day.label}
            </button>
          ))}
        </div>
      </section>

      {loading && <section className="panel"><p className="empty">Carregando cardápio...</p></section>}
      {!loading && !selectedMenu && <section className="panel"><p className="empty">Nenhum item de cardápio cadastrado.</p></section>}

      {!loading && selectedMenu && (
        <section className="menu-board">
          {Object.entries(groupedItems).map(([section, items]) => (
            <article className="panel menu-section-card" key={section}>
              <h2>{section}</h2>
              <div className="menu-items-grid">
                {items.map((item) => (
                  <div className="menu-item-card" key={item.id}>
                    <span>{item.item}</span>
                    <strong>{item.values[selectedDay]}</strong>
                    {canManage && (
                      <div className="row-actions icon-actions menu-item-actions">
                        <button type="button" className="secondary icon-button" onClick={() => startEditingMenuItem(item)} aria-label={`Editar ${item.item}`} title="Editar">
                          <Edit3 size={17} />
                        </button>
                        <button type="button" className="danger-button icon-button" onClick={() => deleteMenuItem(item)} aria-label={`Excluir ${item.item}`} title="Excluir">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

    </Shell>
  )
}
function WorkerOrdersPage({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<StockCategory[]>([])
  const [orders, setOrders] = useState<StockOrder[]>([])
  const [category, setCategory] = useState<'todas' | ProductCategory>('todas')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [quantity, setQuantity] = useState('')
  const [items, setItems] = useState<Array<{ product_id: number; quantity: string }>>([])
  const [notes, setNotes] = useState('')
  const [orderDate, setOrderDate] = useState(todayIso())
  const [error, setError] = useState('')

  async function load() {
    const [productsPayload, categoriesPayload, ordersPayload] = await Promise.all([
      api.products(),
      api.stockCategories(),
      api.stockOrders(orderDate),
    ])
    setProducts(productsPayload)
    setCategories(categoriesPayload)
    setOrders(ordersPayload)
  }

  useEffect(() => {
    void load()
  }, [orderDate])

  const visibleProducts = useMemo(
    () => products.filter((product) => category === 'todas' || product.category === category),
    [products, category],
  )

  const matchingProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (!normalizedSearch) return []
    return visibleProducts
      .filter((product) => product.name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedSearch))
      .slice(0, 8)
  }, [productSearch, visibleProducts])

  function productById(id: number) {
    return products.find((product) => product.id === id)
  }

  function addItem() {
    const productId = Number(selectedProductId)
    const trimmedQuantity = quantity.trim()
    if (!productId || !trimmedQuantity) return
    setItems((current) => {
      const withoutSameProduct = current.filter((item) => item.product_id !== productId)
      return [...withoutSameProduct, { product_id: productId, quantity: trimmedQuantity }]
    })
    setSelectedProductId('')
    setProductSearch('')
    setQuantity('')
  }

  function selectProduct(product: Product) {
    setSelectedProductId(String(product.id))
    setProductSearch(product.name)
  }

  function removeItem(productId: number) {
    setItems((current) => current.filter((item) => item.product_id !== productId))
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await api.createStockOrder({ date: orderDate, notes: notes.trim() || undefined, items })
      setItems([])
      setNotes('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar pedido.')
    }
  }

  const selectedProduct = selectedProductId ? productById(Number(selectedProductId)) : null

  return (
    <Shell session={session} onLogout={onLogout} title="Meus pedidos" subtitle="Solicite produtos do estoque e acompanhe o status.">
      <section className="grid two stock-layout">
        <div className="panel">
          <h2>Criar pedido</h2>
          <form className="stack" onSubmit={submitOrder}>
            <label>
              Data do pedido
              <input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} required />
            </label>

            <div className="segmented-control" aria-label="Filtrar produtos">
              <button type="button" className={category === 'todas' ? 'active' : ''} onClick={() => { setCategory('todas'); setSelectedProductId(''); setProductSearch('') }}>Todos</button>
              {categories.map((item) => (
                <button type="button" key={item.id} className={category === item.name ? 'active' : ''} onClick={() => { setCategory(item.name); setSelectedProductId(''); setProductSearch('') }}>{item.name}</button>
              ))}
            </div>

            <div className="order-form-row">
              <label>
                Produto
                <div className="product-search">
                  <input
                    value={productSearch}
                    onChange={(event) => { setProductSearch(event.target.value); setSelectedProductId('') }}
                    placeholder="Digite o nome do produto"
                    autoComplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={productSearch.trim().length > 0 && !selectedProductId}
                  />
                  {productSearch.trim().length > 0 && !selectedProductId && (
                    <div className="product-suggestions" role="listbox" aria-label="Produtos encontrados">
                      {matchingProducts.map((product) => (
                        <button type="button" className="product-suggestion" key={product.id} onClick={() => selectProduct(product)}>
                          <span>{product.name}</span>
                          <small>{product.unit}</small>
                        </button>
                      ))}
                      {matchingProducts.length === 0 && <p className="product-suggestions-empty">Nenhum produto encontrado.</p>}
                    </div>
                  )}
                </div>
              </label>
              <label>
                Quantidade
                <input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Ex.: 2 caixas" />
              </label>
              <button type="button" className="secondary" onClick={addItem} disabled={!selectedProductId || !quantity.trim()}>
                <Plus size={18} /> Adicionar
              </button>
            </div>

            {selectedProduct?.observations && <p className="hint product-note">{selectedProduct.observations}</p>}

            <div className="stock-items">
              {items.map((item) => {
                const product = productById(item.product_id)
                if (!product) return null
                return (
                  <div className="stock-item" key={item.product_id}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{stockCategoryLabel(product.category)} - {item.quantity} {product.unit}</span>
                      {product.observations && <small>{product.observations}</small>}
                    </div>
                    <button type="button" className="danger-button compact" onClick={() => removeItem(item.product_id)}>Remover</button>
                  </div>
                )
              })}
              {items.length === 0 && <p className="empty">Adicione pelo menos um produto ao pedido.</p>}
            </div>

            <label>
              Observação geral
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="primary" disabled={items.length === 0}>
              <ShoppingCart size={18} /> Enviar pedido
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>Histórico de {formatDate(orderDate)}</h2>
          <div className="list">
            {orders.map((order) => <StockOrderCard key={order.id} order={order} />)}
            {orders.length === 0 && <p className="empty">Você ainda não fez pedidos.</p>}
          </div>
        </div>
      </section>
    </Shell>
  )
}

function StockOrderCard({
  order,
  canManage,
  onStatusChange,
}: {
  order: StockOrder
  canManage?: boolean
  onStatusChange?: (order: StockOrder, status: StockOrderStatus) => void
}) {
  const nextStatus: StockOrderStatus | null = order.status === 'pendente' ? 'separado' : order.status === 'separado' ? 'entregue' : null

  return (
    <article className="stock-order-card">
      <div className="stock-order-header">
        <div className="card-details">
          <strong>Pedido #{order.id}</strong>
          <DetailLine label="Solicitante">{order.requested_by_name}</DetailLine>
          <DetailLine label="Data do pedido">{formatDate(order.requested_date)}</DetailLine>
          <DetailLine label="Criado em">{formatDateTime(order.created_at)}</DetailLine>
          {order.notes && <DetailLine label="Observação">{order.notes}</DetailLine>}
        </div>
        <span className={'pill status-' + order.status}>{stockStatusLabels[order.status]}</span>
      </div>

      <div className="stock-items">
        {order.items.map((item) => (
          <div className="stock-item" key={item.id}>
            <div>
              <strong>{item.product_name}</strong>
              <span>{stockCategoryLabel(item.product_category)} - {item.quantity} {item.product_unit}</span>
            </div>
          </div>
        ))}
      </div>

      {canManage && nextStatus && (
        <div className="row-actions">
          <button type="button" className="primary compact" onClick={() => onStatusChange?.(order, nextStatus)}>
            <CheckCircle2 size={16} /> Marcar {stockStatusLabels[nextStatus].toLowerCase()}
          </button>
        </div>
      )}
    </article>
  )
}

function TaskList({
  tasks,
  showOwner,
  showDate,
  onEdit,
  onDelete,
}: {
  tasks: DayPayload['tasks']
  showOwner?: boolean
  showDate?: boolean
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
}) {
  return (
    <div className="list">
      {tasks.map((task) => (
        <article className={`row-card ${task.completed_at ? 'done' : ''}`} key={task.id}>
          <div className="card-details">
            <strong>{task.title}</strong>
            {showOwner && <DetailLine label="Responsável">{task.user_name}</DetailLine>}
            <DetailLine label="Observação">{task.notes || 'Sem observação'}</DetailLine>
            {showDate && <DetailLine label="Data">{formatDate(task.date)}</DetailLine>}
            <DetailLine label="Urgência">{priorityLabels[task.priority]}{task.due_time ? ` - limite ${task.due_time}` : ''}</DetailLine>
          </div>
          <div className="row-actions">
            {isOverdue(task) && <span className="pill danger">atrasada</span>}
            {task.completed_at ? (
              <span className="pill success">Feito {formatDateTime(task.completed_at)}</span>
            ) : (
              <span className={`pill priority-${task.priority}`}>pendente</span>
            )}
            {onEdit && (
              <button type="button" className="secondary compact" onClick={() => onEdit(task)}>
                <Edit3 size={16} /> Editar
              </button>
            )}
            {onDelete && (
              <button type="button" className="danger-button compact" onClick={() => onDelete(task)}>
                <Trash2 size={16} /> Excluir
              </button>
            )}
          </div>
        </article>
      ))}
      {tasks.length === 0 && <p className="empty">Nenhuma tarefa criada.</p>}
    </div>
  )
}

function NoticeList({
  notices,
  showExpiry,
  onEdit,
  onDelete,
}: {
  notices: Notice[]
  showExpiry?: boolean
  onEdit?: (notice: Notice) => void
  onDelete?: (notice: Notice) => void
}) {
  return (
    <div className="list">
      {notices.map((notice) => (
        <article className="notice-card" key={notice.id}>
          <div>
            <strong>{notice.title}</strong>
            <time>{formatDateTime(notice.created_at)}</time>
            {showExpiry && notice.expires_at && <span>Disponível até {formatDate(notice.expires_at)}</span>}
            {notice.body && <p>{notice.body}</p>}
          </div>
          <div className="row-actions">
            {notice.pdf_data_url && (
              <a className="button secondary compact" href={notice.pdf_data_url} download={notice.pdf_name ?? 'mural.pdf'} target="_blank" rel="noreferrer">
                <FileText size={16} /> PDF
              </a>
            )}
            {onEdit && (
              <button type="button" className="secondary compact" onClick={() => onEdit(notice)}>
                <Edit3 size={16} /> Editar
              </button>
            )}
            {onDelete && (
              <button type="button" className="danger-button compact" onClick={() => onDelete(notice)}>
                <Trash2 size={16} /> Excluir
              </button>
            )}
          </div>
        </article>
      ))}
      {notices.length === 0 && <p className="empty">Nenhuma notícia publicada.</p>}
    </div>
  )
}

export default App





























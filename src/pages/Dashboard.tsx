import { useCallback, useEffect, useState } from 'react'
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Inbox,
  Loader2,
  Plus,
  Timer,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTimerContext } from '@/contexts/TimerContext'
import { useStats } from '@/hooks/useStats'
import { useCategories } from '@/hooks/useCategories'
import { formatTime, formatDuration, localMidnightISO } from '@/lib/formatTime'
import { PRIORITY_COLORS, PRIORITY_LABELS, CATEGORY_TYPE_LABELS } from '@/lib/constants'
import { Modal, Select, Input, Label } from '@/components/ui'
import { TaskForm } from '@/components/tasks'
import { WeeklyGoalsCard, TodaySummaryCard } from '@/components/dashboard'
import type { Task, Category, TaskStatus, SessionType } from '@/types'

// ----- Tipo auxiliar para task + categoria -----

type TaskWithCategory = Task & { categories: Pick<Category, 'name' | 'type'> | null }

// ----- Durações de Pomodoro pré-definidas (segundos) -----

const POMODORO_DURATIONS = [
  { label: '15 min', value: 15 * 60 },
  { label: '25 min', value: 25 * 60 },
  { label: '30 min', value: 30 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '50 min', value: 50 * 60 },
]

// ----- Componentes internos -----

function TimerCard() {
  const { user } = useAuth()
  const {
    elapsedTime,
    remainingTime,
    mode,
    setMode,
    pomodoroDuration,
    setPomodoroDuration,
    status,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimerContext()

  const { categories, isLoading: categoriesLoading } = useCategories()

  // Seleção de categoria / tarefa para a sessão
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [categoryTasks, setCategoryTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  // Modal de pausa (substitui window.prompt)
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
  const [pauseReason, setPauseReason] = useState('')

  // Stats do dia
  const [workToday, setWorkToday] = useState(0)
  const [studyToday, setStudyToday] = useState(0)

  useEffect(() => {
    if (!user) return

    const todayISO = localMidnightISO()

    supabase
      .from('time_entries')
      .select('session_type, total_duration')
      .eq('user_id', user.id)
      .gte('start_time', todayISO)
      .not('total_duration', 'is', null)
      .then(({ data, error }) => {
        if (error) {
          console.error('[Dashboard] Erro ao buscar stats:', error.message)
          return
        }
        const entries = (data ?? []) as Array<{ session_type: 'WORK' | 'STUDY'; total_duration: number | null }>
        let work = 0
        let study = 0
        for (const entry of entries) {
          if (entry.session_type === 'WORK') work += entry.total_duration ?? 0
          else if (entry.session_type === 'STUDY') study += entry.total_duration ?? 0
        }
        setWorkToday(work)
        setStudyToday(study)
      })
  }, [user, status])

  // Buscar tarefas pendentes da categoria selecionada
  useEffect(() => {
    if (!user || !selectedCategoryId) {
      setCategoryTasks([])
      return
    }

    setIsLoadingTasks(true)

    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('category_id', selectedCategoryId)
      .in('status', ['PENDING', 'IN_PROGRESS'])
      .order('priority', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('[Dashboard] Erro ao buscar tarefas da categoria:', error.message)
        }
        setCategoryTasks((data as Task[]) ?? [])
        setIsLoadingTasks(false)
      })
  }, [user, selectedCategoryId])

  // Limpar taskId quando a categoria mudar
  useEffect(() => {
    setSelectedTaskId('')
  }, [selectedCategoryId])

  // Derivar sessionType da categoria selecionada
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const derivedSessionType: SessionType =
    selectedCategory?.type === 'STUDY' ? 'STUDY' : 'WORK'

  const handlePlayPause = async () => {
    if (status === 'idle') {
      if (!selectedCategoryId) return
      await startTimer(derivedSessionType, selectedTaskId || undefined, selectedCategoryId)
    } else if (isRunning) {
      setIsPauseModalOpen(true)
    } else if (isPaused) {
      await resumeTimer()
    }
  }

  const handleConfirmPause = async () => {
    await pauseTimer(pauseReason.trim() || undefined)
    setPauseReason('')
    setIsPauseModalOpen(false)
  }

  const handleStop = async () => {
    if (status !== 'idle') {
      await stopTimer()
      setSelectedCategoryId('')
      setSelectedTaskId('')
    }
  }

  const displayTime = mode === 'pomodoro' ? remainingTime : elapsedTime
  const isIdle = status === 'idle'
  const canStart = isIdle && !!selectedCategoryId

  // Progresso do pomodoro (0-100)
  const pomodoroProgress =
    mode === 'pomodoro' && pomodoroDuration > 0
      ? Math.min(100, (elapsedTime / pomodoroDuration) * 100)
      : 0

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2 text-slate-400">
        <Clock className="h-4 w-4" />
        <span className="text-xs font-semibold tracking-widest uppercase">Foco Atual</span>
      </div>

      {/* Mode selector tabs */}
      <div className="mb-6 flex items-center justify-center">
        <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setMode('free')}
            disabled={!isIdle}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'free'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            } disabled:cursor-not-allowed`}
          >
            <Clock className="h-3.5 w-3.5" />
            Cronômetro
          </button>
          <button
            onClick={() => setMode('pomodoro')}
            disabled={!isIdle}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'pomodoro'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            } disabled:cursor-not-allowed`}
          >
            <Timer className="h-3.5 w-3.5" />
            Pomodoro
          </button>
        </div>
      </div>

      {/* Pomodoro duration picker (only when idle + pomodoro) */}
      {mode === 'pomodoro' && isIdle && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {POMODORO_DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setPomodoroDuration(d.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                pomodoroDuration === d.value
                  ? 'bg-rose-600/20 text-rose-400 ring-1 ring-rose-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Seleção de Categoria + Tarefa (quando idle) */}
      {isIdle && (
        <div className="mb-6 space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="timer-category" className="text-[11px]">
              Categoria *
            </Label>
            <Select
              id="timer-category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={categoriesLoading}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({CATEGORY_TYPE_LABELS[cat.type]})
                </option>
              ))}
            </Select>
          </div>

          {selectedCategoryId && (
            <div className="space-y-1.5">
              <Label htmlFor="timer-task" className="text-[11px]">
                Tarefa (opcional)
              </Label>
              <Select
                id="timer-task"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                disabled={isLoadingTasks}
              >
                <option value="">Sem tarefa</option>
                {categoryTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Modal de pausa */}
      <Modal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        title="Pausar Sessão"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pause-reason">Motivo da pausa (opcional)</Label>
            <Input
              id="pause-reason"
              placeholder="Ex: Intervalo para café, reunião..."
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setPauseReason('')
                setIsPauseModalOpen(false)
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmPause}
              className="rounded-lg bg-amber-500/15 px-4 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
            >
              Pausar
            </button>
          </div>
        </div>
      </Modal>

      {/* Status badge */}
      <div className="mb-2 text-center">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            isRunning
              ? mode === 'pomodoro'
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-emerald-500/15 text-emerald-400'
              : isPaused
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-slate-800 text-slate-500'
          }`}
        >
          {isRunning
            ? mode === 'pomodoro'
              ? 'Pomodoro em andamento'
              : derivedSessionType === 'STUDY'
                ? 'Em andamento — Estudo'
                : 'Em andamento — Trabalho'
            : isPaused
              ? 'Pausado'
              : 'Parado'}
        </span>
      </div>

      {/* Timer display */}
      <p
        className={`text-center font-mono text-7xl font-bold tracking-tight lg:text-8xl ${
          isPaused
            ? 'animate-pulse text-amber-300'
            : mode === 'pomodoro' && isRunning
              ? 'text-rose-100'
              : 'text-slate-100'
        }`}
      >
        {formatTime(displayTime)}
      </p>

      {/* Pomodoro progress bar */}
      {mode === 'pomodoro' && !isIdle && (
        <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-1000"
            style={{ width: `${pomodoroProgress}%` }}
          />
        </div>
      )}

      {/* Controles */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={handleStop}
          disabled={isIdle}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
          title="Parar"
        >
          <Square className="h-4 w-4" />
        </button>

        <button
          onClick={handlePlayPause}
          disabled={isIdle && !canStart}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 ${
            isPaused
              ? 'bg-amber-500 shadow-amber-500/25'
              : mode === 'pomodoro'
                ? 'bg-rose-600 shadow-rose-600/25'
                : 'bg-primary-600 shadow-primary-600/25'
          }`}
          title={isRunning ? 'Pausar' : isPaused ? 'Retomar' : canStart ? 'Iniciar' : 'Selecione uma categoria'}
        >
          {isRunning ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </button>

        {/* Espaço reservado para manter simetria */}
        <div className="h-10 w-10" />
      </div>

      {/* Stats rápidos */}
      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-100">{formatDuration(workToday)}</p>
          <p className="mt-0.5 text-xs text-slate-500">Trabalhado hoje</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-100">{formatDuration(studyToday)}</p>
          <p className="mt-0.5 text-xs text-slate-500">Estudado hoje</p>
        </div>
      </div>
    </div>
  )
}

// ----- Task Item -----

function TaskItem({ task }: { task: TaskWithCategory }) {
  const [done, setDone] = useState(task.status === 'COMPLETED')

  const toggleDone = async () => {
    const newStatus: TaskStatus = done ? 'PENDING' : 'COMPLETED'
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (error) {
      console.error('[Dashboard] Erro ao atualizar task:', error.message)
      return
    }
    setDone(!done)
  }

  const categoryLabel = task.categories?.name
    ?? (task.categories?.type ? CATEGORY_TYPE_LABELS[task.categories.type] : null)

  return (
    <div className="group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-slate-800/50">
      <button
        onClick={toggleDone}
        className="mt-0.5 shrink-0 text-slate-500 transition-colors hover:text-primary-400"
      >
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-snug ${
            done ? 'text-slate-500 line-through' : 'text-slate-200'
          }`}
        >
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {categoryLabel && (
            <>
              <span className="text-[11px] text-slate-500">{categoryLabel}</span>
              <span className="text-slate-700">·</span>
            </>
          )}
          <span className={`text-[11px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
      </div>
    </div>
  )
}

// ----- Tasks Card -----

function TasksCard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTasks = useCallback(() => {
    if (!user) return
    setIsLoading(true)

    supabase
      .from('tasks')
      .select('*, categories(name, type)')
      .eq('user_id', user.id)
      .in('status', ['PENDING', 'IN_PROGRESS'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[Dashboard] Erro ao buscar tasks:', error.message)
        }
        setTasks((data as TaskWithCategory[]) ?? [])
        setIsLoading(false)
      })
  }, [user])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleTaskCreated = () => {
    setIsModalOpen(false)
    fetchTasks()
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <ListTodo className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-widest uppercase">Tarefas Pendentes</span>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && tasks.length > 0 && (
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
              {tasks.length}
            </span>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-primary-600/15 px-2.5 py-1 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-600/25"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Modal de criação */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Tarefa">
        <TaskForm onSuccess={handleTaskCreated} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Inbox className="mb-2 h-8 w-8 text-slate-700" />
          <p className="text-sm font-medium text-slate-500">Nenhuma tarefa pendente!</p>
          <p className="mt-0.5 text-xs text-slate-600">Crie uma tarefa para começar.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/50">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

// ----- Greeting helper -----

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ----- Página -----

export function Dashboard() {
  const { user } = useAuth()
  const { status } = useTimerContext()
  const stats = useStats()
  const displayName = user?.user_metadata?.full_name ?? 'Usuário'

  // Refetch stats quando o timer para (sessão gravada)
  useEffect(() => {
    if (status === 'idle') {
      stats.refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <div className="mx-auto max-w-6xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">
          {getGreeting()}, {displayName} 👋
        </h1>
        <p className="mt-1 text-sm capitalize text-slate-500">
          {getFormattedDate()} — Vamos focar!
        </p>
      </div>

      {/* Grid principal — 2 colunas no desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna esquerda: Timer + Metas */}
        <div className="space-y-6">
          <TimerCard />
          <WeeklyGoalsCard
            workGoalHours={stats.workGoalHours}
            studyGoalHours={stats.studyGoalHours}
            weekWorkSeconds={stats.weekWorkSeconds}
            weekStudySeconds={stats.weekStudySeconds}
            workPercent={stats.workPercent}
            studyPercent={stats.studyPercent}
            isLoading={stats.isLoading}
          />
        </div>

        {/* Coluna direita: Resumo do dia + Tarefas */}
        <div className="space-y-6">
          <TodaySummaryCard
            todayTotalSeconds={stats.todayTotalSeconds}
            todayByCategory={stats.todayByCategory}
            isLoading={stats.isLoading}
          />
          <TasksCard />
        </div>
      </div>
    </div>
  )
}

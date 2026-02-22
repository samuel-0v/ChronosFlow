import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { TaskWithCategory } from '@/hooks/useWork'
import type { TaskStatus } from '@/types'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'

// ----- Tipos -----

type KanbanColumnDef = {
  status: TaskStatus
  label: string
  icon: React.ReactNode
  border: string
  badge: string
}

interface WorkKanbanProps {
  tasks: TaskWithCategory[]
  isUpdating: boolean
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>
}

// ----- Colunas -----

const COLUMNS: KanbanColumnDef[] = [
  {
    status: 'PENDING',
    label: 'Pendentes',
    icon: <Clock className="h-4 w-4 text-slate-400" />,
    border: 'border-slate-700',
    badge: 'bg-slate-500/15 text-slate-400',
  },
  {
    status: 'IN_PROGRESS',
    label: 'Em Andamento',
    icon: <AlertCircle className="h-4 w-4 text-amber-400" />,
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  {
    status: 'COMPLETED',
    label: 'Concluídas',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-400',
  },
]

const STATUS_ORDER: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

function getAdjacentStatus(
  current: TaskStatus,
  direction: 'left' | 'right',
): TaskStatus | null {
  const idx = STATUS_ORDER.indexOf(current)
  const next = direction === 'right' ? idx + 1 : idx - 1
  return next >= 0 && next < STATUS_ORDER.length ? STATUS_ORDER[next] : null
}

// ----- Card -----

function KanbanCard({
  task,
  isUpdating,
  onStatusChange,
}: {
  task: TaskWithCategory
  isUpdating: boolean
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>
}) {
  const leftStatus = getAdjacentStatus(task.status, 'left')
  const rightStatus = getAdjacentStatus(task.status, 'right')

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition-colors hover:border-slate-700">
      {/* Header: Categoria + Prioridade */}
      <div className="mb-1.5 flex items-center justify-between">
        {task.categories ? (
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: task.categories.color_hex }}
            />
            {task.categories.name}
          </span>
        ) : (
          <span />
        )}
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* Título */}
      <p className="text-sm font-medium leading-snug text-slate-200">
        {task.title}
      </p>

      {/* Due date */}
      {task.due_date && (
        <p className="mt-1 text-[11px] text-slate-600">
          Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
        </p>
      )}

      {/* Arrows */}
      <div className="mt-2 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
        {leftStatus ? (
          <button
            disabled={isUpdating}
            onClick={() => onStatusChange(task.id, leftStatus)}
            className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
            title={`Mover para ${STATUS_ORDER[STATUS_ORDER.indexOf(task.status) - 1]}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <span />
        )}
        {rightStatus ? (
          <button
            disabled={isUpdating}
            onClick={() => onStatusChange(task.id, rightStatus)}
            className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
            title={`Mover para ${STATUS_ORDER[STATUS_ORDER.indexOf(task.status) + 1]}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}

// ----- Kanban Board -----

export function WorkKanban({
  tasks,
  isUpdating,
  onStatusChange,
}: WorkKanbanProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status)

        return (
          <div
            key={col.status}
            className={`rounded-2xl border bg-slate-900/50 p-4 ${col.border}`}
          >
            {/* Column header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {col.icon}
                <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
                  {col.label}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${col.badge}`}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Cards */}
            {columnTasks.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-800 py-8">
                <p className="text-xs text-slate-600">Nenhuma tarefa</p>
              </div>
            ) : (
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    isUpdating={isUpdating}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Overlay de loading sutil */}
      {isUpdating && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-2">
          <div className="flex items-center gap-2 rounded-full bg-slate-800/90 px-3 py-1.5 shadow-lg">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-400" />
            <span className="text-xs text-slate-300">Atualizando…</span>
          </div>
        </div>
      )}
    </div>
  )
}

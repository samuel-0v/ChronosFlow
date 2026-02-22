// ==========================================
// ChronosFlow - Tasks Page (Central de Tarefas)
// ==========================================

import { useMemo, useState } from 'react'
import {
  Plus,
  Loader2,
  Inbox,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react'
import { useTasks, type TaskWithCategory } from '@/hooks/useTasks'
import { PRIORITY_LABELS, PRIORITY_COLORS, STATUS_LABELS } from '@/lib/constants'
import { getLocalISODate } from '@/lib/formatTime'
import { Modal, Button } from '@/components/ui'
import { TaskForm } from '@/components/tasks'
import type { Task } from '@/types'

// ----- Filtros -----

type FilterKey = 'ALL' | 'WORK' | 'STUDY' | 'PENDING' | 'COMPLETED'

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'WORK', label: 'Trabalho' },
  { key: 'STUDY', label: 'Estudos' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'COMPLETED', label: 'Concluídas' },
]

// ----- Helpers -----

function formatDueDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'COMPLETED') return false
  return dueDate < getLocalISODate()
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Circle className="h-3.5 w-3.5 text-slate-500" />,
  IN_PROGRESS: <AlertCircle className="h-3.5 w-3.5 text-amber-400" />,
  COMPLETED: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
}

// ----- Task Card -----

function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggle,
}: {
  task: TaskWithCategory
  onEdit: (task: Task) => void
  onDelete: (task: TaskWithCategory) => void
  onToggle: (task: TaskWithCategory) => void
}) {
  const overdue = isOverdue(task.due_date, task.status)

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-slate-900 transition-colors hover:border-slate-700 ${
        overdue ? 'border-red-500/30' : 'border-slate-800'
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-3">
        <button
          onClick={() => onToggle(task)}
          className="mt-0.5 shrink-0 p-0.5 transition-colors hover:text-primary-400"
          title={task.status === 'COMPLETED' ? 'Marcar como pendente' : 'Marcar como concluída'}
        >
          {STATUS_ICONS[task.status]}
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold leading-snug ${
              task.status === 'COMPLETED'
                ? 'text-slate-500 line-through'
                : 'text-slate-100'
            }`}
          >
            {task.title}
          </p>

          {/* Categoria */}
          {task.categories ? (
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: task.categories.color_hex }}
              />
              {task.categories.name}
            </span>
          ) : (
            <span className="mt-1.5 inline-block text-[11px] text-slate-600">
              Sem categoria
            </span>
          )}
        </div>

        {/* Prioridade badge */}
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* Métricas */}
      <div className="mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-slate-800/50 px-4 py-2.5">
        {/* Status */}
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          {STATUS_ICONS[task.status]}
          {STATUS_LABELS[task.status]}
        </span>

        {/* Due date */}
        {task.due_date && (
          <span
            className={`flex items-center gap-1 text-[11px] ${
              overdue ? 'font-semibold text-red-400' : 'text-slate-400'
            }`}
          >
            <Calendar className="h-3 w-3" />
            {formatDueDate(task.due_date)}
            {overdue && ' (atrasada)'}
          </span>
        )}

        {/* Tempo estimado */}
        {task.estimated_time != null && (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            {task.estimated_time} min
          </span>
        )}
      </div>

      {/* Ações — sempre visível no mobile, hover no desktop */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(task)
          }}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 active:bg-slate-700"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task)
          }}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 active:bg-red-500/20"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ----- Página -----

export function Tasks() {
  const { tasks, isLoading, refetch, updateTask, deleteTask, toggleTaskStatus } = useTasks()

  const [filter, setFilter] = useState<FilterKey>('ALL')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Filtragem
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      switch (filter) {
        case 'WORK':
          return t.categories?.type === 'WORK'
        case 'STUDY':
          return t.categories?.type === 'STUDY'
        case 'PENDING':
          return t.status === 'PENDING' || t.status === 'IN_PROGRESS'
        case 'COMPLETED':
          return t.status === 'COMPLETED'
        default:
          return true
      }
    })
  }, [tasks, filter])

  const handleCreated = () => {
    setIsCreateOpen(false)
    refetch()
  }

  const handleEdited = () => {
    setEditingTask(null)
    refetch()
  }

  const handleDelete = async (task: TaskWithCategory) => {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return
    await deleteTask(task.id)
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Minhas Tarefas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie todas as suas tarefas em um só lugar.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === opt.key
                ? 'bg-primary-600/15 text-primary-400'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Modal criação */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nova Tarefa"
      >
        <TaskForm
          onSuccess={handleCreated}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Modal edição */}
      <Modal
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        title="Editar Tarefa"
      >
        {editingTask && (
          <TaskForm
            initialData={editingTask}
            onUpdate={updateTask}
            onSuccess={handleEdited}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16">
          <Inbox className="mb-2 h-8 w-8 text-slate-700" />
          <p className="text-sm font-medium text-slate-500">
            {filter === 'ALL'
              ? 'Nenhuma tarefa criada.'
              : 'Nenhuma tarefa neste filtro.'}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {filter === 'ALL'
              ? 'Clique em "Nova Tarefa" para começar.'
              : 'Tente outro filtro ou crie uma tarefa.'}
          </p>
          {filter === 'ALL' && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Criar primeira tarefa
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={setEditingTask}
              onDelete={handleDelete}
              onToggle={toggleTaskStatus}
            />
          ))}
        </div>
      )}

      {/* Contagem */}
      {!isLoading && filtered.length > 0 && (
        <p className="mt-4 text-center text-xs text-slate-600">
          {filtered.length} {filtered.length === 1 ? 'tarefa' : 'tarefas'}
          {filter !== 'ALL' && ` · filtro: ${FILTER_OPTIONS.find((o) => o.key === filter)?.label}`}
        </p>
      )}
    </div>
  )
}

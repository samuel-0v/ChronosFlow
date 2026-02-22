import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  GripVertical,
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
  dropBg: string
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
    dropBg: 'bg-slate-500/5',
  },
  {
    status: 'IN_PROGRESS',
    label: 'Em Andamento',
    icon: <AlertCircle className="h-4 w-4 text-amber-400" />,
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-400',
    dropBg: 'bg-amber-500/5',
  },
  {
    status: 'COMPLETED',
    label: 'Concluídas',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-400',
    dropBg: 'bg-emerald-500/5',
  },
]

// ----- Card -----

function KanbanCard({
  task,
  index,
}: {
  task: TaskWithCategory
  index: number
}) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group rounded-xl border bg-slate-950/60 p-3 transition-colors ${
            snapshot.isDragging
              ? 'border-primary-500/40 shadow-lg shadow-primary-500/10'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start gap-2">
            {/* Drag handle */}
            <span
              {...provided.dragHandleProps}
              className="mt-0.5 shrink-0 cursor-grab touch-none text-slate-700 transition-colors group-hover:text-slate-500 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
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
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

// ----- Kanban Board -----

export function WorkKanban({
  tasks,
  isUpdating,
  onStatusChange,
}: WorkKanbanProps) {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Dropped fora de uma coluna ou na mesma posição
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return

    const newStatus = destination.droppableId as TaskStatus

    // Se mudou de coluna, atualizar status
    if (newStatus !== source.droppableId) {
      void onStatusChange(draggableId, newStatus)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status)

          return (
            <Droppable droppableId={col.status} key={col.status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-2xl border p-4 transition-colors ${col.border} ${
                    snapshot.isDraggingOver
                      ? `${col.dropBg} border-opacity-80`
                      : 'bg-slate-900/50'
                  }`}
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
                  {columnTasks.length === 0 && !snapshot.isDraggingOver ? (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-800 py-8">
                      <p className="text-xs text-slate-600">Nenhuma tarefa</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {columnTasks.map((task, index) => (
                        <KanbanCard
                          key={task.id}
                          task={task}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
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
    </DragDropContext>
  )
}

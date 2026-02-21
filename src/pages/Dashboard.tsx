import { Play, Pause, RotateCcw, CheckCircle2, Circle, Clock, ListTodo } from 'lucide-react'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants'
import type { TaskPriority } from '@/types'

// ----- Dados mockados -----

interface MockTask {
  id: string
  title: string
  category: string
  priority: TaskPriority
  done: boolean
}

const mockTasks: MockTask[] = [
  {
    id: '1',
    title: 'Revisar PR do módulo de autenticação',
    category: 'Trabalho',
    priority: 1,
    done: false,
  },
  {
    id: '2',
    title: 'Estudar capítulo 5 — Estruturas de Dados',
    category: 'Faculdade',
    priority: 2,
    done: false,
  },
  {
    id: '3',
    title: 'Configurar CI/CD do ChronosFlow',
    category: 'Trabalho',
    priority: 3,
    done: true,
  },
]

// ----- Componentes internos -----

function TimerCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2 text-slate-400">
        <Clock className="h-4 w-4" />
        <span className="text-xs font-semibold tracking-widest uppercase">Foco Atual</span>
      </div>

      {/* Categoria ativa (mock) */}
      <div className="mb-2 text-center">
        <span className="inline-block rounded-full bg-primary-600/15 px-3 py-1 text-xs font-medium text-primary-400">
          Trabalho — Sprint Review
        </span>
      </div>

      {/* Timer */}
      <p className="text-center font-mono text-7xl font-bold tracking-tight text-slate-100 lg:text-8xl">
        00:00:00
      </p>

      {/* Controles */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
          title="Reiniciar"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/25 transition-transform hover:scale-105 active:scale-95"
          title="Iniciar"
        >
          <Play className="h-6 w-6 ml-0.5" />
        </button>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
          title="Pausar"
        >
          <Pause className="h-4 w-4" />
        </button>
      </div>

      {/* Stats rápidos */}
      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-100">3h 20m</p>
          <p className="mt-0.5 text-xs text-slate-500">Trabalhado hoje</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-100">1h 45m</p>
          <p className="mt-0.5 text-xs text-slate-500">Estudado hoje</p>
        </div>
      </div>
    </div>
  )
}

function TaskItem({ task }: { task: MockTask }) {
  return (
    <div className="group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-slate-800/50">
      {/* Checkbox */}
      <button className="mt-0.5 shrink-0 text-slate-500 transition-colors hover:text-primary-400">
        {task.done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-snug ${
            task.done ? 'text-slate-500 line-through' : 'text-slate-200'
          }`}
        >
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[11px] text-slate-500">{task.category}</span>
          <span className="text-slate-700">·</span>
          <span className={`text-[11px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
      </div>
    </div>
  )
}

function TasksCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <ListTodo className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-widest uppercase">Tarefas de Hoje</span>
        </div>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          {mockTasks.filter((t) => !t.done).length} pendentes
        </span>
      </div>

      {/* Lista */}
      <div className="divide-y divide-slate-800/50">
        {mockTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      {/* CTA */}
      <button className="mt-4 w-full rounded-lg border border-dashed border-slate-700 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-400">
        + Adicionar tarefa
      </button>
    </div>
  )
}

// ----- Página -----

export function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Bom dia, Usuário 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sexta-feira, 21 de fevereiro de 2026 — Vamos focar!
        </p>
      </div>

      {/* Grid principal */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Timer — ocupa 3 colunas */}
        <div className="lg:col-span-3">
          <TimerCard />
        </div>

        {/* Tarefas — ocupa 2 colunas */}
        <div className="lg:col-span-2">
          <TasksCard />
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  LayoutGrid,
  Plus,
  Loader2,
  Inbox,
  Trash2,
  Clock,
  CheckCircle2,
  ListTodo,
  Activity,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCategories, type CategoryWithMetrics } from '@/hooks/useCategories'
import { formatDuration } from '@/lib/formatTime'
import { CATEGORY_TYPE_LABELS } from '@/lib/constants'
import { Modal, Button } from '@/components/ui'
import { CategoryForm } from '@/components/categories'

// ----- Helpers -----

const TYPE_BADGE_COLORS: Record<string, string> = {
  WORK: 'bg-blue-500/15 text-blue-400',
  STUDY: 'bg-emerald-500/15 text-emerald-400',
  PERSONAL: 'bg-violet-500/15 text-violet-400',
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'agora mesmo'
  if (diffMin < 60) return `há ${diffMin}min`

  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`

  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'ontem'
  if (diffD < 7) return `há ${diffD} dias`

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

// ----- Card de Categoria -----

function CategoryCard({
  category,
  onDeleted,
}: {
  category: CategoryWithMetrics
  onDeleted: () => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return
    setIsDeleting(true)

    const { error } = await supabase.from('categories').delete().eq('id', category.id)

    if (error) {
      console.error('[Settings] Erro ao excluir categoria:', error.message)
      setIsDeleting(false)
      return
    }

    onDeleted()
  }

  const badgeColor = TYPE_BADGE_COLORS[category.type] ?? 'bg-slate-700 text-slate-300'
  const totalTasks = category.pendingTasks + category.completedTasks

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900 transition-colors hover:border-slate-700">
      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-slate-800"
          style={{ backgroundColor: category.color_hex }}
        />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100">
          {category.name}
        </h3>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}
        >
          {CATEGORY_TYPE_LABELS[category.type] ?? category.type}
        </span>
      </div>

      {/* ── Painel de Métricas ── */}
      <div className="mx-4 mb-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-800/50 p-3.5">
        {/* Tempo investido */}
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-700/60">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Tempo
            </p>
            <p className="text-sm font-semibold text-slate-200">
              {formatDuration(category.totalTimeSeconds)}
            </p>
          </div>
        </div>

        {/* Tarefas */}
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-700/60">
            {totalTasks > 0 ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ListTodo className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Tarefas
            </p>
            {totalTasks > 0 ? (
              <p className="text-sm font-semibold text-slate-200">
                <span className="text-amber-400">{category.pendingTasks}</span>
                <span className="mx-1 text-slate-600">·</span>
                <span className="text-emerald-400">{category.completedTasks}</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-slate-500">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Legenda de tarefas (abaixo do painel) */}
      {totalTasks > 0 && (
        <div className="mx-5 mb-3 flex items-center gap-3 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            pendentes
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            concluídas
          </span>
        </div>
      )}

      {/* ── Rodapé ── */}
      <div className="mt-auto flex items-center justify-between border-t border-slate-800/60 px-5 py-3">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <Activity className="h-3 w-3" />
          {category.lastActivity
            ? formatRelativeDate(category.lastActivity)
            : 'Sem atividade'}
        </span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="shrink-0 rounded-lg p-1.5 text-slate-700 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ----- Página -----

export function SettingsPage() {
  const { categories, isLoading, refetch } = useCategories()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreated = () => {
    setIsModalOpen(false)
    refetch()
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Central de Insights</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visão geral de tempo, tarefas e atividade por categoria.
        </p>
      </div>

      {/* Seção: Categorias */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-widest uppercase">Categorias</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-primary-600/15 px-2.5 py-1 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-600/25"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Categoria
          </button>
        </div>

        {/* Modal de criação */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Categoria">
          <CategoryForm onSuccess={handleCreated} onCancel={() => setIsModalOpen(false)} />
        </Modal>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="mb-2 h-8 w-8 text-slate-700" />
            <p className="text-sm font-medium text-slate-500">Nenhuma categoria criada</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Crie categorias para organizar suas tarefas e sessões.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Criar primeira categoria
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onDeleted={refetch} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { useState } from 'react'
import { Plus, Pencil, Trash2, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FinanceCategoryForm } from './FinanceCategoryForm'
import { SafeDeleteModal } from './SafeDeleteModal'
import type {
  FinanceCategory,
  FinanceCategoryInsert,
  FinanceCategoryUpdate,
} from '@/types/finance'

// ===================== Props =====================

interface CategoryManagerProps {
  categories: FinanceCategory[]
  isLoading: boolean
  onCreate: (data: Omit<FinanceCategoryInsert, 'user_id'>) => Promise<boolean>
  onUpdate: (id: string, data: FinanceCategoryUpdate) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

// ===================== Helpers =====================

function typeBadge(type: FinanceCategory['type']) {
  const isIncome = type === 'INCOME'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
        isIncome
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-red-500/10 text-red-400 ring-red-500/20'
      }`}
    >
      {isIncome ? 'Receita' : 'Despesa'}
    </span>
  )
}

// ===================== Skeleton =====================

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-4 py-3 animate-pulse"
        >
          <div className="h-5 w-5 rounded-full bg-slate-700" />
          <div className="h-4 w-28 rounded bg-slate-700" />
          <div className="ml-auto h-5 w-16 rounded-full bg-slate-700" />
        </div>
      ))}
    </div>
  )
}

// ===================== Componente =====================

export function CategoryManager({
  categories,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  // ---- Estado ----
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FinanceCategory | null>(null)

  // ---- Handlers ----
  const handleOpenCreate = () => {
    setEditingCategory(null)
    setView('form')
  }

  const handleOpenEdit = (cat: FinanceCategory) => {
    setEditingCategory(cat)
    setView('form')
  }

  const handleFormSubmit = async (data: Omit<FinanceCategoryInsert, 'user_id'>): Promise<boolean> => {
    if (editingCategory) {
      const ok = await onUpdate(editingCategory.id, data)
      if (ok) {
        setView('list')
        setEditingCategory(null)
      }
      return ok
    }

    const ok = await onCreate(data)
    if (ok) setView('list')
    return ok
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await onDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  // ---- Separar por tipo ----
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')
  const incomeCategories = categories.filter((c) => c.type === 'INCOME')

  // ===================== Formulário =====================
  if (view === 'form') {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setView('list')
            setEditingCategory(null)
          }}
          className="mb-4 text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Voltar à lista
        </button>

        <FinanceCategoryForm
          key={editingCategory?.id ?? 'new'}
          initialData={editingCategory ?? undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setView('list')
            setEditingCategory(null)
          }}
        />
      </div>
    )
  }

  // ===================== Lista =====================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
        </p>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-700 py-12">
          <div className="rounded-xl bg-slate-800 p-3">
            <Inbox className="h-6 w-6 text-slate-500" />
          </div>
          <p className="text-sm text-slate-400">Nenhuma categoria criada</p>
          <Button size="sm" variant="secondary" onClick={handleOpenCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Criar Categoria
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Despesas */}
          {expenseCategories.length > 0 && (
            <CategoryGroup
              title="Despesas"
              items={expenseCategories}
              onEdit={handleOpenEdit}
              onDelete={setDeleteTarget}
            />
          )}

          {/* Receitas */}
          {incomeCategories.length > 0 && (
            <CategoryGroup
              title="Receitas"
              items={incomeCategories}
              onEdit={handleOpenEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </div>
      )}

      {/* Safe Delete */}
      <SafeDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        resourceName={deleteTarget?.name ?? ''}
        warningText="Transações vinculadas a esta categoria ficarão sem categoria."
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

// ===================== Grupo de categoria =====================

function CategoryGroup({
  title,
  items,
  onEdit,
  onDelete,
}: {
  title: string
  items: FinanceCategory[]
  onEdit: (cat: FinanceCategory) => void
  onDelete: (cat: FinanceCategory) => void
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h4>
      <div className="divide-y divide-slate-800/50 rounded-xl border border-slate-800 bg-slate-800/30">
        {items.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-800/50"
          >
            {/* Cor */}
            <span
              className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-white/10"
              style={{ backgroundColor: cat.color_hex ?? '#94a3b8' }}
            />

            {/* Nome + tipo */}
            <span className="flex-1 truncate text-sm text-slate-200">{cat.name}</span>
            {typeBadge(cat.type)}

            {/* Ações */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(cat)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(cat)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

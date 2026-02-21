import { useState } from 'react'
import { Settings, Plus, Loader2, Inbox, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCategories } from '@/hooks/useCategories'
import { CATEGORY_TYPE_LABELS } from '@/lib/constants'
import { Modal, Button } from '@/components/ui'
import { CategoryForm } from '@/components/categories'

// ----- Componente de card de categoria -----

function CategoryCard({
  category,
  onDeleted,
}: {
  category: { id: string; name: string; type: string; color_hex: string }
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

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition-colors hover:border-slate-700">
      {/* Bolinha de cor */}
      <span
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: category.color_hex }}
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">{category.name}</p>
        <p className="text-[11px] text-slate-500">
          {CATEGORY_TYPE_LABELS[category.type] ?? category.type}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="shrink-0 rounded-lg p-1.5 text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
        title="Excluir"
      >
        <Trash2 className="h-4 w-4" />
      </button>
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
        <h1 className="text-2xl font-bold text-slate-100">Configurações</h1>
        <p className="mt-1 text-sm text-slate-500">Ajuste suas metas e preferências.</p>
      </div>

      {/* Seção: Categorias */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Settings className="h-4 w-4" />
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onDeleted={refetch} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

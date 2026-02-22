import { useState } from 'react'
import { Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { FlashcardWithCategory } from '@/hooks/useStudy'

interface FlashcardItemProps {
  flashcard: FlashcardWithCategory
  onDeleted: () => void
}

export function FlashcardItem({ flashcard, onDeleted }: FlashcardItemProps) {
  const [revealed, setRevealed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Excluir este flashcard?')) return
    setIsDeleting(true)

    const { error } = await supabase.from('flashcards').delete().eq('id', flashcard.id)

    if (error) {
      console.error('[FlashcardItem] Erro ao excluir:', error.message)
      setIsDeleting(false)
      return
    }

    onDeleted()
  }

  const isDue = new Date(flashcard.next_review) <= new Date()

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-slate-900/50 transition-colors ${
        isDue ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Badge de revisão */}
      {isDue && (
        <div className="flex items-center gap-1 border-b border-amber-500/20 bg-amber-500/5 px-4 py-1.5">
          <RotateCcw className="h-3 w-3 text-amber-400" />
          <span className="text-[11px] font-medium text-amber-400">Revisão pendente</span>
        </div>
      )}

      <div className="px-4 py-3">
        {/* Header: categoria + delete */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {flashcard.categories && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: flashcard.categories.color_hex }}
                />
                {flashcard.categories.name}
              </span>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="shrink-0 rounded-lg p-1 text-slate-700 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Frente */}
        <p className="text-sm font-medium leading-snug text-slate-200">
          {flashcard.front_question}
        </p>

        {/* Revelar / Resposta */}
        {revealed ? (
          <div className="mt-3">
            <div className="border-t border-dashed border-slate-700 pt-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-300">
                {flashcard.back_answer}
              </p>
            </div>
            <button
              onClick={() => setRevealed(false)}
              className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-300"
            >
              <EyeOff className="h-3 w-3" />
              Ocultar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary-600/10 px-3 py-1.5 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-600/20"
          >
            <Eye className="h-3.5 w-3.5" />
            Revelar Resposta
          </button>
        )}
      </div>
    </div>
  )
}

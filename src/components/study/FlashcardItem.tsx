import { useState } from 'react'
import { Eye, Trash2, RotateCcw, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { FlashcardWithCategory } from '@/hooks/useStudy'

interface FlashcardItemProps {
  flashcard: FlashcardWithCategory
  onDeleted: () => void
  onReview: (cardId: string, grade: number) => Promise<void>
}

export function FlashcardItem({ flashcard, onDeleted, onReview }: FlashcardItemProps) {
  const [revealed, setRevealed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGrading, setIsGrading] = useState(false)

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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 active:bg-red-500/20 disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Frente */}
        <p className="text-sm font-medium leading-snug text-slate-200">
          {flashcard.front_question}
        </p>

        {/* Revelar / Resposta + Avaliação */}
        {revealed ? (
          <div className="mt-3">
            <div className="border-t border-dashed border-slate-700 pt-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-300">
                {flashcard.back_answer}
              </p>
            </div>

            {/* Grade buttons — SM-2 */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
              {([
                { grade: 0, label: 'Errei', color: 'bg-red-500/15 text-red-400 hover:bg-red-500/25 active:bg-red-500/35' },
                { grade: 1, label: 'Difícil', color: 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 active:bg-orange-500/35' },
                { grade: 2, label: 'Bom', color: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 active:bg-emerald-500/35' },
                { grade: 3, label: 'Fácil', color: 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 active:bg-blue-500/35' },
              ] as const).map(({ grade, label, color }) => (
                <button
                  key={grade}
                  disabled={isGrading}
                  onClick={async () => {
                    setIsGrading(true)
                    await onReview(flashcard.id, grade)
                    setRevealed(false)
                    setIsGrading(false)
                  }}
                  className={`flex-1 basis-[calc(50%-0.5rem)] rounded-xl py-3 px-4 text-sm font-semibold transition-colors disabled:opacity-50 sm:basis-auto sm:min-w-[5rem] ${color}`}
                >
                  {isGrading ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    label
                  )}
                </button>
              ))}
            </div>
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

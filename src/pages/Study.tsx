import { useState } from 'react'
import { BookOpen, Brain, Layers, Plus, Loader2 } from 'lucide-react'
import { useStudy } from '@/hooks/useStudy'
import { Modal } from '@/components/ui'
import {
  StudyNoteForm,
  StudyNoteList,
  FlashcardForm,
  FlashcardItem,
} from '@/components/study'

export function Study() {
  const {
    notes,
    flashcards,
    isLoadingNotes,
    isLoadingFlashcards,
    refetchNotes,
    refetchFlashcards,
  } = useStudy()

  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)

  const handleFlashcardCreated = () => {
    setIsFlashcardModalOpen(false)
    refetchFlashcards()
  }

  const dueCount = flashcards.filter(
    (fc) => new Date(fc.next_review) <= new Date(),
  ).length

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Estudos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Acompanhe suas matérias, flashcards e notas.
        </p>
      </div>

      {/* Grid 2 colunas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ====== Coluna Esquerda: Brain Dump ====== */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            {/* Header */}
            <div className="mb-4 flex items-center gap-2 text-slate-400">
              <Brain className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-widest uppercase">
                Brain Dump
              </span>
            </div>

            {/* Form sempre visível */}
            <StudyNoteForm onSuccess={refetchNotes} />

            {/* Separador */}
            <div className="my-5 border-t border-slate-800" />

            {/* Lista de notas */}
            {isLoadingNotes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : (
              <StudyNoteList notes={notes} onDeleted={refetchNotes} />
            )}
          </div>
        </div>

        {/* ====== Coluna Direita: Flashcards ====== */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Layers className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-widest uppercase">
                  Flashcards
                </span>
              </div>

              <div className="flex items-center gap-2">
                {dueCount > 0 && (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                    {dueCount} para revisar
                  </span>
                )}
                <button
                  onClick={() => setIsFlashcardModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-primary-600/15 px-2.5 py-1 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-600/25"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Novo Card
                </button>
              </div>
            </div>

            {/* Modal de criação */}
            <Modal
              isOpen={isFlashcardModalOpen}
              onClose={() => setIsFlashcardModalOpen(false)}
              title="Novo Flashcard"
            >
              <FlashcardForm
                onSuccess={handleFlashcardCreated}
                onCancel={() => setIsFlashcardModalOpen(false)}
              />
            </Modal>

            {/* Lista de flashcards */}
            {isLoadingFlashcards ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : flashcards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="mb-2 h-7 w-7 text-slate-700" />
                <p className="text-sm text-slate-500">Nenhum flashcard criado.</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Crie cards para memorização espaçada!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {flashcards.map((fc) => (
                  <FlashcardItem
                    key={fc.id}
                    flashcard={fc}
                    onDeleted={refetchFlashcards}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

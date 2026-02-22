import { ExternalLink, Brain, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StudyNoteWithCategory } from '@/hooks/useStudy'

interface StudyNoteListProps {
  notes: StudyNoteWithCategory[]
  onDeleted: () => void
}

function NoteCard({ note, onDeleted }: { note: StudyNoteWithCategory; onDeleted: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Excluir esta nota?')) return
    setIsDeleting(true)

    const { error } = await supabase.from('study_notes').delete().eq('id', note.id)

    if (error) {
      console.error('[StudyNoteList] Erro ao excluir nota:', error.message)
      setIsDeleting(false)
      return
    }

    onDeleted()
  }

  const isLink = note.note_type === 'LINK'
  const dateStr = new Date(note.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 transition-colors hover:border-slate-700">
      {/* Icon + tipo + data */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLink ? (
            <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
          ) : (
            <Brain className="h-3.5 w-3.5 text-purple-400" />
          )}
          <span className="text-[11px] font-medium text-slate-500">
            {isLink ? 'Link' : 'Brain Dump'}
          </span>
          {note.categories && (
            <>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: note.categories.color_hex }}
                />
                {note.categories.name}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">{dateStr}</span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="shrink-0 rounded-lg p-1 text-slate-700 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {isLink ? (
        <a
          href={note.content}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-sm text-blue-400 underline decoration-blue-400/30 hover:decoration-blue-400"
        >
          {note.content}
        </a>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {note.content}
        </p>
      )}
    </div>
  )
}

export function StudyNoteList({ notes, onDeleted }: StudyNoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="py-8 text-center">
        <Brain className="mx-auto mb-2 h-7 w-7 text-slate-700" />
        <p className="text-sm text-slate-500">Nenhuma nota ainda.</p>
        <p className="mt-0.5 text-xs text-slate-600">Use o formulário acima para anotar!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onDeleted={onDeleted} />
      ))}
    </div>
  )
}

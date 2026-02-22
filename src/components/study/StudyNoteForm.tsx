import { type FormEvent, useState } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTimerContext } from '@/contexts/TimerContext'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type { NoteType } from '@/types'

interface StudyNoteFormProps {
  onSuccess: () => void
}

export function StudyNoteForm({ onSuccess }: StudyNoteFormProps) {
  const { user } = useAuth()
  const { activeEntryId } = useTimerContext()
  const { categories, isLoading: categoriesLoading } = useCategories()

  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('BRAIN_DUMP')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('Utilizador não autenticado.')
      return
    }

    if (!content.trim()) {
      setError('O conteúdo é obrigatório.')
      return
    }

    setIsSubmitting(true)

    const { error: insertError } = await supabase
      .from('study_notes')
      .insert([
        {
          user_id: user.id,
          content: content.trim(),
          category_id: categoryId || null,
          note_type: noteType,
          time_entry_id: activeEntryId ?? null,
        },
      ])

    setIsSubmitting(false)

    if (insertError) {
      console.error('[StudyNoteForm] Erro ao criar nota:', insertError.message)
      setError('Erro ao salvar nota. Tente novamente.')
      return
    }

    setContent('')
    setCategoryId('')
    setNoteType('BRAIN_DUMP')
    onSuccess()
  }

  // Filtrar apenas categorias de estudo
  const studyCategories = categories.filter((c) => c.type === 'STUDY')

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Conteúdo */}
      <Textarea
        placeholder="Anote uma ideia, cole um link, faça um brain dump..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        required
        className="resize-none"
      />

      {/* Linha inferior: selects + botão */}
      <div className="flex flex-wrap items-end gap-2">
        {/* Tipo */}
        <div className="w-32 space-y-1">
          <Label htmlFor="note-type" className="text-[11px]">Tipo</Label>
          <Select
            id="note-type"
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as NoteType)}
          >
            <option value="BRAIN_DUMP">Brain Dump</option>
            <option value="LINK">Link</option>
          </Select>
        </div>

        {/* Categoria */}
        <div className="min-w-[140px] flex-1 space-y-1">
          <Label htmlFor="note-category" className="text-[11px]">Categoria</Label>
          <Select
            id="note-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={categoriesLoading}
          >
            <option value="">Sem categoria</option>
            {studyCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Enviar */}
        <Button type="submit" size="md" isLoading={isSubmitting} className="shrink-0">
          <Send className="h-4 w-4" />
          Salvar
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
    </form>
  )
}

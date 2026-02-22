import { type FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'

interface FlashcardFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

export function FlashcardForm({ onSuccess, onCancel }: FlashcardFormProps) {
  const { user } = useAuth()
  const { categories, isLoading: categoriesLoading } = useCategories()

  const [frontQuestion, setFrontQuestion] = useState('')
  const [backAnswer, setBackAnswer] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const studyCategories = categories.filter((c) => c.type === 'STUDY')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('Utilizador não autenticado.')
      return
    }

    if (!frontQuestion.trim()) {
      setError('A pergunta é obrigatória.')
      return
    }

    if (!backAnswer.trim()) {
      setError('A resposta é obrigatória.')
      return
    }

    setIsSubmitting(true)

    const { error: insertError } = await supabase
      .from('flashcards')
      .insert([
        {
          user_id: user.id,
          front_question: frontQuestion.trim(),
          back_answer: backAnswer.trim(),
          category_id: categoryId || null,
        },
      ])

    setIsSubmitting(false)

    if (insertError) {
      console.error('[FlashcardForm] Erro ao criar flashcard:', insertError.message)
      setError('Erro ao criar flashcard. Tente novamente.')
      return
    }

    setFrontQuestion('')
    setBackAnswer('')
    setCategoryId('')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pergunta */}
      <div className="space-y-1.5">
        <Label htmlFor="fc-front">Pergunta (frente) *</Label>
        <Input
          id="fc-front"
          placeholder="Ex: Qual a complexidade do QuickSort?"
          value={frontQuestion}
          onChange={(e) => setFrontQuestion(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Resposta */}
      <div className="space-y-1.5">
        <Label htmlFor="fc-back">Resposta (verso) *</Label>
        <Textarea
          id="fc-back"
          placeholder="Ex: O(n log n) em média, O(n²) no pior caso"
          value={backAnswer}
          onChange={(e) => setBackAnswer(e.target.value)}
          rows={3}
          required
        />
      </div>

      {/* Categoria */}
      <div className="space-y-1.5">
        <Label htmlFor="fc-category">Categoria</Label>
        <Select
          id="fc-category"
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

      {/* Erro */}
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          Criar Flashcard
        </Button>
      </div>
    </form>
  )
}

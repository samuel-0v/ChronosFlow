import { type FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { getLocalISODate } from '@/lib/formatTime'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type { TaskPriority } from '@/types'

interface TaskFormProps {
  /** Callback chamado após inserção bem-sucedida */
  onSuccess: () => void
  /** Callback para cancelar / fechar */
  onCancel?: () => void
}

export function TaskForm({ onSuccess, onCancel }: TaskFormProps) {
  const { user } = useAuth()
  const { categories, isLoading: categoriesLoading } = useCategories()

  // Estado do formulário
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(3)
  const [dueDate, setDueDate] = useState(getLocalISODate())
  const [estimatedTime, setEstimatedTime] = useState('')

  // Estado de submissão
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('Utilizador não autenticado.')
      return
    }

    if (!title.trim()) {
      setError('O título é obrigatório.')
      return
    }

    setIsSubmitting(true)

    const { error: insertError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: user.id,
          title: title.trim(),
          category_id: categoryId || null,
          priority,
          due_date: dueDate || null,
          estimated_time: estimatedTime ? Number(estimatedTime) : null,
        },
      ])

    setIsSubmitting(false)

    if (insertError) {
      console.error('[TaskForm] Erro ao criar tarefa:', insertError.message)
      setError('Erro ao criar tarefa. Tente novamente.')
      return
    }

    // Limpar e notificar pai
    setTitle('')
    setCategoryId('')
    setPriority(3)
    setDueDate(getLocalISODate())
    setEstimatedTime('')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Título *</Label>
        <Input
          id="task-title"
          placeholder="Ex: Revisar relatório trimestral"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Categoria */}
      <div className="space-y-1.5">
        <Label htmlFor="task-category">Categoria</Label>
        <Select
          id="task-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={categoriesLoading}
        >
          <option value="">Sem categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Prioridade */}
      <div className="space-y-1.5">
        <Label htmlFor="task-priority">Prioridade</Label>
        <Select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value) as TaskPriority)}
        >
          <option value={1}>1 — Urgente</option>
          <option value={2}>2 — Alta</option>
          <option value={3}>3 — Média</option>
          <option value={4}>4 — Baixa</option>
        </Select>
      </div>

      {/* Data limite */}
      <div className="space-y-1.5">
        <Label htmlFor="task-due-date">Data limite</Label>
        <Input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={getLocalISODate()}
        />
      </div>

      {/* Tempo estimado */}
      <div className="space-y-1.5">
        <Label htmlFor="task-estimated-time">Tempo estimado (minutos)</Label>
        <Input
          id="task-estimated-time"
          type="number"
          placeholder="Ex: 60"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          min={1}
        />
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
          Criar Tarefa
        </Button>
      </div>
    </form>
  )
}

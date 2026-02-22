import { type FormEvent, useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { getLocalISODate } from '@/lib/formatTime'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type { Task, TaskPriority, TaskUpdate } from '@/types'

interface TaskFormProps {
  /** Callback chamado após inserção/atualização bem-sucedida */
  onSuccess: () => void
  /** Callback para cancelar / fechar */
  onCancel?: () => void
  /** Se fornecido, ativa o modo edição */
  initialData?: Task
  /** Função de update externa (do useTasks) — usada no modo edição */
  onUpdate?: (taskId: string, data: TaskUpdate) => Promise<boolean>
}

export function TaskForm({ onSuccess, onCancel, initialData, onUpdate }: TaskFormProps) {
  const { user } = useAuth()
  const { categories, isLoading: categoriesLoading } = useCategories()

  const isEditMode = Boolean(initialData)

  // Estado do formulário
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(3)
  const [dueDate, setDueDate] = useState(getLocalISODate())
  const [estimatedTime, setEstimatedTime] = useState('')

  // Estado de submissão
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Popular campos no modo edição
  useEffect(() => {
    if (!initialData) return
    setTitle(initialData.title)
    setCategoryId(initialData.category_id ?? '')
    setPriority(initialData.priority)
    setDueDate(initialData.due_date ?? '')
    setEstimatedTime(initialData.estimated_time ? String(initialData.estimated_time) : '')
  }, [initialData])

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

    // ----- Modo edição -----
    if (isEditMode && initialData && onUpdate) {
      const success = await onUpdate(initialData.id, {
        title: title.trim(),
        category_id: categoryId || null,
        priority,
        due_date: dueDate || null,
        estimated_time: estimatedTime ? Number(estimatedTime) : null,
      })

      setIsSubmitting(false)

      if (!success) {
        setError('Erro ao salvar alterações. Tente novamente.')
        return
      }

      onSuccess()
      return
    }

    // ----- Modo criação -----
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
              {(cat.type === 'STUDY' ? '📖 ' : '💼 ') + cat.name}
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
          min={isEditMode ? undefined : new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Tempo estimado */}
      <div className="space-y-1.5">
        <Label htmlFor="task-estimated-time" className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          Tempo estimado
          <span className="text-[10px] font-normal text-slate-600">(minutos)</span>
        </Label>
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
          {isEditMode ? 'Salvar Alterações' : 'Criar Tarefa'}
        </Button>
      </div>
    </form>
  )
}

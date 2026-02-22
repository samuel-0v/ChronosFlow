// ==========================================
// ChronosFlow - useTasks Hook
// ==========================================
// Busca todas as tarefas do usuário com join de categoria.
// Expõe mutações: createTask, updateTask, deleteTask.

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Task, TaskInsert, TaskUpdate, Category } from '@/types'

// ----- Tipos -----

export type TaskWithCategory = Task & {
  categories: Pick<Category, 'name' | 'color_hex' | 'type'> | null
}

interface UseTasksReturn {
  tasks: TaskWithCategory[]
  isLoading: boolean
  isSubmitting: boolean
  refetch: () => void
  createTask: (data: Omit<TaskInsert, 'user_id'>) => Promise<boolean>
  updateTask: (taskId: string, data: TaskUpdate) => Promise<boolean>
  deleteTask: (taskId: string) => Promise<boolean>
  toggleTaskStatus: (task: Task) => Promise<boolean>
}

// ----- Hook -----

export function useTasks(): UseTasksReturn {
  const { user } = useAuth()

  const [tasks, setTasks] = useState<TaskWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  // ----- Fetch -----
  useEffect(() => {
    if (!user) {
      setTasks([])
      setIsLoading(false)
      return
    }

    // Só mostra loading na carga inicial (sem dados)
    if (tasks.length === 0) setIsLoading(true)

    supabase
      .from('tasks')
      .select('*, categories(name, color_hex, type)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[useTasks] Erro ao buscar tarefas:', error.message)
        }
        setTasks((data as TaskWithCategory[]) ?? [])
        setIsLoading(false)
      })
  }, [user, tick])

  // ----- Create -----
  const createTask = useCallback(
    async (data: Omit<TaskInsert, 'user_id'>): Promise<boolean> => {
      if (!user) return false
      setIsSubmitting(true)

      const { error } = await supabase
        .from('tasks')
        .insert([{ ...data, user_id: user.id }])

      setIsSubmitting(false)

      if (error) {
        console.error('[useTasks] Erro ao criar tarefa:', error.message)
        return false
      }

      refetch()
      return true
    },
    [user, refetch],
  )

  // ----- Update -----
  const updateTask = useCallback(
    async (taskId: string, data: TaskUpdate): Promise<boolean> => {
      if (!user) return false
      setIsSubmitting(true)

      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', taskId)

      setIsSubmitting(false)

      if (error) {
        console.error('[useTasks] Erro ao atualizar tarefa:', error.message)
        return false
      }

      refetch()
      return true
    },
    [user, refetch],
  )

  // ----- Delete -----
  const deleteTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      if (!user) return false
      setIsSubmitting(true)

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      setIsSubmitting(false)

      if (error) {
        console.error('[useTasks] Erro ao excluir tarefa:', error.message)
        return false
      }

      refetch()
      return true
    },
    [user, refetch],
  )

  // ----- Toggle Status -----
  const toggleTaskStatus = useCallback(
    async (task: Task): Promise<boolean> => {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
      return updateTask(task.id, { status: newStatus })
    },
    [updateTask],
  )

  return {
    tasks,
    isLoading,
    isSubmitting,
    refetch,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  }
}
